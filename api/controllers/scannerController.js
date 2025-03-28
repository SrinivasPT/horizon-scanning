const scannerService = require('../services/scannerService');

// Helper function for standardized responses
const sendResponse = (res, statusCode, success, message, data = {}) => {
    const response = { success, message, ...data };
    return res.status(statusCode).json(response);
};

// Start a new scanner job
exports.startScannerJob = async (req, res) => {
    try {
        const { jobId, correlationId } = req.body;
        console.log('Received request to start scanner job:', jobId);

        if (!jobId) return sendResponse(res, 400, false, 'Missing required fields: jobId is required');

        const result = await scannerService.startJob(jobId, correlationId);
        return sendResponse(res, 201, true, 'Scanner job started successfully', result);
    } catch (error) {
        console.error('Error starting scanner job:', error.message);
        return sendResponse(res, 500, false, 'Failed to start scanner job', { details: error.message });
    }
};

// Complete a scanner job with success
exports.completeScannerJob = async (req, res) => {
    try {
        console.log('Received request to complete scanner job:', req.body);
        const { jobRunId, resultData } = req.body;

        if (!jobRunId) {
            console.error('Missing required field: id');
            return sendResponse(res, 400, false, 'Missing required field: id');
        }

        console.log(`Processing completion for job Run ID: ${jobRunId}`);
        const result = await scannerService.completeJob(jobRunId, resultData);
        console.log(`Job completion update result:`, result);

        try {
            console.log(`Starting to populate documents staging for job ID: ${jobRunId}`);
            await scannerService.populateDocumentsStaging(jobRunId, resultData);
            console.log(`Successfully populated documents staging for job ID: ${jobRunId}`);
        } catch (stagingError) {
            console.error(`Error populating documents staging for job ID: ${jobRunId}:`, stagingError);
            return sendResponse(res, 500, false, 'Failed to populate documents staging', {
                details: stagingError.message,
                jobId: jobRunId,
                status: 'PARTIAL_COMPLETION',
            });
        }

        if (result.affectedRows === 0) {
            console.warn(`Job ID: ${jobRunId} not found or not in running state`);
            return sendResponse(res, 404, false, 'Scanner job not found or not in running state', { jobId: jobRunId });
        }

        console.log(`Successfully completed job ID: ${jobRunId}`);
        return sendResponse(res, 200, true, 'Scanner job completed successfully', {
            id: jobRunId,
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
            documentsProcessed: resultData?.documents?.length || 0,
        });
    } catch (error) {
        const jobRunId = req.body?.jobRunId || 'unknown';
        console.error(`Error completing scanner job ID: ${jobRunId}:`, error);
        return sendResponse(res, 500, false, 'Failed to complete scanner job', {
            details: error.message,
            jobRunId: jobRunId,
            status: 'ERROR',
        });
    }
};

// Mark a scanner job as failed
exports.failScannerJob = async (req, res) => {
    try {
        const { jobRunId, errorMessage } = req.body;

        if (!jobRunId) return sendResponse(res, 400, false, 'Missing required field: id');

        const result = await scannerService.failJob(jobRunId, errorMessage);

        if (result.affectedRows === 0) return sendResponse(res, 404, false, 'Scanner job not found or not in running state');

        return sendResponse(res, 200, true, 'Scanner job marked as failed', { jobRunId, status: 'failed' });
    } catch (error) {
        console.error('Error marking scanner job as failed:', error);
        return sendResponse(res, 500, false, 'Failed to update scanner job status', { details: error.message });
    }
};

// Get scanner job details
exports.getScannerJob = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return sendResponse(res, 400, false, 'Missing required parameter: id');

        const job = await scannerService.getJob(id);

        if (!job) return sendResponse(res, 404, false, 'Scanner job not found');

        return sendResponse(res, 200, true, 'Job retrieved successfully', job);
    } catch (error) {
        console.error('Error retrieving scanner job:', error);
        return sendResponse(res, 500, false, 'Failed to retrieve scanner job', { details: error.message });
    }
};

exports.populateDocumentsStaging = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        const result = await scannerService.populateDocumentsStaging(parseInt(id, 10));

        return res.status(200).json({
            success: true,
            message: `Successfully populated document staging with ${result.insertedCount} records`,
            data: result,
        });
    } catch (error) {
        console.error('Error populating document staging:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to populate document staging',
            error: error.message,
        });
    }
};

// Fix constructor error from the original code
class ScannerController {}
module.exports = exports;
