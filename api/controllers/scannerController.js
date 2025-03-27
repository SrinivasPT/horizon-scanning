const scannerService = require('../services/scannerService');

// Helper function for standardized responses
const sendResponse = (res, statusCode, success, message, data = {}) => {
    const response = { success, message, ...data };
    return res.status(statusCode).json(response);
};

// Start a new scanner job
exports.startScannerJob = async (req, res) => {
    try {
        const { jobId, correlationId, jobName, source } = req.body;
        console.log('Received request to start scanner job:', jobId);

        if (!jobId || !jobName || !source)
            return sendResponse(res, 400, false, 'Missing required fields: jobId, jobName, and source are required');

        const result = await scannerService.startJob(jobId, correlationId, jobName, source);
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
        const { id, resultData } = req.body;
        const jobId = id || 'unknown';

        if (!id) {
            console.error('Missing required field: id');
            return sendResponse(res, 400, false, 'Missing required field: id');
        }

        console.log(`Processing completion for job ID: ${jobId}`);
        const result = await scannerService.completeJob(jobId, resultData);
        console.log(`Job completion update result:`, result);

        try {
            console.log(`Starting to populate documents staging for job ID: ${jobId}`);
            await scannerService.populateDocumentsStaging(jobId, resultData);
            console.log(`Successfully populated documents staging for job ID: ${jobId}`);
        } catch (stagingError) {
            console.error(`Error populating documents staging for job ID: ${jobId}:`, stagingError);
            return sendResponse(res, 500, false, 'Failed to populate documents staging', {
                details: stagingError.message,
                jobId: jobId,
                status: 'PARTIAL_COMPLETION',
            });
        }

        if (result.affectedRows === 0) {
            console.warn(`Job ID: ${jobId} not found or not in running state`);
            return sendResponse(res, 404, false, 'Scanner job not found or not in running state', { jobId: jobId });
        }

        console.log(`Successfully completed job ID: ${jobId}`);
        return sendResponse(res, 200, true, 'Scanner job completed successfully', {
            id: jobId,
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
            documentsProcessed: resultData?.documents?.length || 0,
        });
    } catch (error) {
        const jobId = req.body?.id || 'unknown';
        console.error(`Error completing scanner job ID: ${jobId}:`, error);
        return sendResponse(res, 500, false, 'Failed to complete scanner job', {
            details: error.message,
            jobId: jobId,
            status: 'ERROR',
        });
    }
};

// Mark a scanner job as failed
exports.failScannerJob = async (req, res) => {
    try {
        const { id, errorMessage } = req.body;

        if (!id) return sendResponse(res, 400, false, 'Missing required field: id');

        const result = await scannerService.failJob(id, errorMessage);

        if (result.affectedRows === 0) return sendResponse(res, 404, false, 'Scanner job not found or not in running state');

        return sendResponse(res, 200, true, 'Scanner job marked as failed', { id, status: 'failed' });
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
            return res.status(400).json({ error: 'Scanner job ID is required' });
        }

        const result = await scannerService.populateDocumentsStaging(parseInt(id, 10));

        return res.status(200).json({
            success: true,
            message: `Successfully populated documents staging with ${result.insertedCount} records`,
            data: result,
        });
    } catch (error) {
        console.error('Error populating documents staging:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to populate documents staging',
            error: error.message,
        });
    }
};

// Fix constructor error from the original code
class ScannerController {}
module.exports = exports;
