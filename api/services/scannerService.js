const { withConnection } = require('../db/dbUtil');

// Scanner service to handle database interactions
class ScannerService {
    /**
     * Start a new scanner job in the database
     */
    async startJob(jobId, correlationId, jobName, source) {
        return withConnection(async connection => {
            const [result] = await connection.query(
                `INSERT INTO scanner (jobId, correlationId, jobName, source, startTime, status)
                VALUES (?, ?, ?, ?, ?, 'RUNNING')`,
                [jobId, correlationId, jobName, source, new Date()]
            );

            return { id: result.insertId, jobName, status: 'RUNNING' };
        });
    }

    /**
     * Complete a scanner job with success status
     */
    async completeJob(id, resultData) {
        return withConnection(async connection => {
            const [result] = await connection.query(
                `UPDATE scanner
                SET status = 'COMPLETED', endTime = ?, resultData = ?
                WHERE id = ? AND status = 'RUNNING'`,
                [new Date(), JSON.stringify(resultData || {}), id]
            );

            return { affectedRows: result.affectedRows };
        });
    }

    /**
     * Populate documents_staging table with data from scanner resultData
     * @param id The scanner job ID
     * @returns Object with count of inserted records
     */
    async populateDocumentsStaging(id, providedResultData = null) {
        return withConnection(async connection => {
            // First, get the job to access correlationId and resultData
            const [jobRows] = await connection.query('SELECT correlationId, jobId, resultData FROM scanner WHERE id = ?', [id]);

            if (jobRows.length === 0) {
                throw new Error(`No scanner job found with id ${id}`);
            }

            const job = jobRows[0];
            const correlationId = job.correlationId;
            const jobRunId = job.jobId;

            // Use provided resultData if available, otherwise use from DB
            const resultData = providedResultData || job.resultData;

            if (!resultData) {
                return { insertedCount: 0 };
            }

            // Ensure resultData is properly formatted as JSON string
            let resultDataJSON;
            if (typeof resultData === 'string') {
                try {
                    // Validate it's proper JSON by parsing and re-stringifying
                    resultDataJSON = JSON.stringify(JSON.parse(resultData));
                } catch (error) {
                    throw new Error(`Invalid JSON in resultData: ${error.message}`);
                }
            } else if (typeof resultData === 'object') {
                resultDataJSON = JSON.stringify(resultData);
            } else {
                throw new Error('Invalid resultData format. Expected JSON object or string');
            }

            // Insert data from resultData JSON into documents_staging using JSON_TABLE
            const [result] = await connection.query(
                `
                INSERT INTO documentsStaging (
                    correlationId, jobRunId, source, typeOfChange, eventType,
                    issuingAuthority, identifier, title, summary, linkToRegChangeText,
                    publishedOn, htmlContent, introducedOn, citationId,
                    billType, regType, year, regulationStatus, billStatus,
                    firstEffectiveDate, enactedDate, topic, comments
                )
                SELECT
                    ? AS correlationId,
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
            `,
                [correlationId, jobRunId, resultDataJSON]
            );

            // Update the processed flag in scanner table
            await connection.query('UPDATE scanner SET processed = TRUE WHERE id = ?', [id]);

            return { insertedCount: result.affectedRows };
        });
    }

    /**
     * Mark a scanner job as failed
     */
    async failJob(id, errorMessage) {
        return withConnection(async connection => {
            const [result] = await connection.query(
                `UPDATE scanner
                SET status = 'FAILED', endTime = ?, errorMessage = ?
                WHERE id = ? AND status = 'RUNNING'`,
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
            const [rows] = await connection.query('SELECT * FROM scanner WHERE id = ?', [id]);

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
