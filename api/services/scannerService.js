const { withConnection } = require('../db/dbUtil');

// Scanner service to handle database interactions
class ScannerService {
    /**
     * Start a new scanner job in the database
     */
    async startJob(jobId, correlationId, jobName, source) {
        return withConnection(async connection => {
            const [result] = await connection.query(
                `INSERT INTO jobRun (jobId, correlationId, startTime, jobStatus)
                VALUES (?, ?, ?, 'RUNNING')`,
                [jobId, correlationId, new Date()]
            );

            return { id: result.insertId, jobStatus: 'RUNNING' };
        });
    }

    /**
     * Complete a scanner job with success status
     */
    async completeJob(jobRunId, resultData) {
        return withConnection(async connection => {
            const [result] = await connection.query(
                `UPDATE jobRun
                SET jobStatus = 'COMPLETED', endTime = ?, resultData = ?
                WHERE id = ? AND jobStatus = 'RUNNING'`,
                [new Date(), JSON.stringify(resultData || {}), jobRunId]
            );

            return { affectedRows: result.affectedRows };
        });
    }

    /**
     * Populate documents_staging table with data from scanner resultData
     * @param jobRunId The scanner job ID
     * @returns Object with count of inserted records
     */
    async populateDocumentsStaging(jobRunId, providedResultData = null, lastRunDate) {
        return withConnection(async connection => {
            const resultData = providedResultData;

            if (!resultData) return { insertedCount: 0 };

            // // Ensure resultData is properly formatted as JSON string
            // let resultDataJSON;
            // if (typeof resultData === 'string') {
            //     try {
            //         // Validate it's proper JSON by parsing and re-stringifying
            //         resultDataJSON = JSON.stringify(JSON.parse(resultData));
            //     } catch (error) {
            //         throw new Error(`Invalid JSON in resultData: ${error.message}`);
            //     }
            // } else if (typeof resultData === 'object') {
            //     resultDataJSON = JSON.stringify(resultData);
            // } else {
            //     throw new Error('Invalid resultData format. Expected JSON object or string');
            // }

            // console.log('Last Run Date:', lastRunDate);

            // Insert data from resultData JSON into documentStaging using JSON_TABLE
            // Only insert records where publishedOn >= lastRunDate
            const [result] = await connection.query(
                `
                INSERT INTO documentStaging (
                    jobRunId, source, typeOfChange, eventType,
                    issuingAuthority, identifier, title, summary, linkToRegChangeText,
                    publishedOn, htmlContent, introducedOn, citationId,
                    billType, regType, year, regulationStatus, billStatus,
                    firstEffectiveDate, enactedDate, topic, comments
                )
                SELECT
                    ? AS jobRunId,
                    doc.source,
                    doc.typeOfChange,
                    doc.eventType,
                    doc.issuingAuthority,
                    doc.identifier,
                    doc.title,
                    doc.summary,
                    doc.linkToRegChangeText,
                    doc.publishedOn,
                    doc.htmlContent,
                    doc.introducedOn,
                    doc.citationId,
                    doc.billType,
                    doc.regType,
                    doc.year,
                    doc.regulationStatus,
                    doc.billStatus,
                    doc.firstEffectiveDate,
                    doc.enactedDate,
                    doc.topic,
                    doc.comments
                FROM
                    JSON_TABLE(
                        ?,
                        '$[*]' COLUMNS (
                            source VARCHAR(255) PATH '$.source',
                            typeOfChange VARCHAR(100) PATH '$.typeOfChange',
                            eventType VARCHAR(100) PATH '$.eventType',
                            issuingAuthority VARCHAR(255) PATH '$.issuingAuthority',
                            identifier VARCHAR(100) PATH '$.identifier',
                            title TEXT PATH '$.title',
                            summary TEXT PATH '$.summary',
                            linkToRegChangeText TEXT PATH '$.linkToRegChangeText',
                            publishedOn TIMESTAMP PATH '$.publishedOn',
                            htmlContent TEXT PATH '$.htmlContent',
                            introducedOn TIMESTAMP PATH '$.introducedOn',
                            citationId VARCHAR(100) PATH '$.citationId',
                            billType VARCHAR(50) PATH '$.billType',
                            regType VARCHAR(50) PATH '$.regType',
                            year CHAR(4) PATH '$.year',
                            regulationStatus VARCHAR(100) PATH '$.regulationStatus',
                            billStatus VARCHAR(100) PATH '$.billStatus',
                            firstEffectiveDate TIMESTAMP PATH '$.firstEffectiveDate',
                            enactedDate TIMESTAMP PATH '$.enactedDate',
                            topic VARCHAR(255) PATH '$.topic',
                            comments TEXT PATH '$.comments'
                        )
                    ) AS doc
                WHERE DATE(doc.publishedOn) >= DATE(?)
            `,
                [jobRunId, JSON.stringify(resultData), lastRunDate]
            );

            const [finalResult] = await connection.query(
                `INSERT INTO documents (
                    jobRunId, source, typeOfChange, eventType,
                    issuingAuthority, identifier, title, summary, linkToRegChangeText,
                    publishedOn, htmlContent, pdfContent, introducedOn, citationId,
                    billType, regType, year, regulationStatus, billStatus,
                    firstEffectiveDate, enactedDate, topic, comments
                )
                SELECT
                    ds.jobRunId, ds.source, ds.typeOfChange, ds.eventType,
                    ds.issuingAuthority, ds.identifier, ds.title, ds.summary, ds.linkToRegChangeText,
                    ds.publishedOn, ds.htmlContent, ds.pdfContent, ds.introducedOn, ds.citationId,
                    ds.billType, ds.regType, ds.year, ds.regulationStatus, ds.billStatus,
                    ds.firstEffectiveDate, ds.enactedDate, ds.topic, ds.comments
                FROM documentStaging ds
                WHERE ds.jobRunId = ?
                AND NOT EXISTS (
                    SELECT 1 FROM documents d
                    WHERE d.source = ds.source
                    AND d.title = ds.title
                    AND DATE(d.publishedOn) = DATE(ds.publishedOn)
                )`,
                [jobRunId]
            );

            return { insertedCount: finalResult.affectedRows };
        });
    }

    /**
     * Insert processed records from documentStaging to documents table
     * Only moves records that don't have matching source, title, and publishedOn date in documents table
     */
    // async moveToDocuments() {
    //     return withConnection(async connection => {
    //         const [result] = await connection.query(
    //             `INSERT INTO documents (
    //                 jobRunId, source, typeOfChange, eventType,
    //                 issuingAuthority, identifier, title, summary, linkToRegChangeText,
    //                 publishedOn, htmlContent, pdfContent, introducedOn, citationId,
    //                 billType, regType, year, regulationStatus, billStatus,
    //                 firstEffectiveDate, enactedDate, topic, comments
    //             )
    //             SELECT
    //                 ds.jobRunId, ds.source, ds.typeOfChange, ds.eventType,
    //                 ds.issuingAuthority, ds.identifier, ds.title, ds.summary, ds.linkToRegChangeText,
    //                 ds.publishedOn, ds.htmlContent, ds.pdfContent, ds.introducedOn, ds.citationId,
    //                 ds.billType, ds.regType, ds.year, ds.regulationStatus, ds.billStatus,
    //                 ds.firstEffectiveDate, ds.enactedDate, ds.topic, ds.comments
    //             FROM documentStaging ds
    //             WHERE ds.processed = FALSE
    //             AND NOT EXISTS (
    //                 SELECT 1 FROM documents d
    //                 WHERE d.source = ds.source
    //                 AND d.title = ds.title
    //                 AND DATE(d.publishedOn) = DATE(ds.publishedOn)
    //             )`
    //         );

    //         // Mark records as processed
    //         // await connection.query('UPDATE documentStaging SET processed = TRUE WHERE processed = FALSE');

    //         return { insertedCount: result.affectedRows };
    //     });
    // }

    /**
     * Mark a scanner job as failed
     */
    async failJob(id, errorMessage) {
        return withConnection(async connection => {
            const [result] = await connection.query(
                `UPDATE jobRun
                SET jobStatus = 'FAILED', endTime = ?, errorMessage = ?
                WHERE id = ? AND jobStatus = 'RUNNING'`,
                [new Date(), errorMessage || 'Unknown error', id]
            );

            return { affectedRows: result.affectedRows };
        });
    }

    /**
     * Get a scanner job by ID
     */
    async getJob(id) {
        return withConnection(async connection => {
            const [rows] = await connection.query('SELECT * FROM jobRun WHERE id = ?', [id]);

            if (rows.length > 0) {
                // If resultData exists and is a string, parse it to an object
                if (rows[0].resultData && typeof rows[0].resultData === 'string') {
                    try {
                        rows[0].resultData = JSON.parse(rows[0].resultData);
                    } catch (error) {
                        console.error('Error parsing resultData JSON:', error);
                        // Keep it as string if parsing fails
                    }
                }

                return rows[0];
            }

            return null;
        });
    }
}

// Export as a singleton instance
module.exports = new ScannerService();
