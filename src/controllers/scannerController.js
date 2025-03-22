const pool = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Helper function to convert UUID to binary
const uuidToBinary = uuid => {
    return Buffer.from(uuid.replace(/-/g, ''), 'hex');
};

// Start a new scanner job
exports.startScannerJob = async (req, res) => {
    try {
        const { job_id, job_name, source, parameters } = req.body;

        if (!job_id || !job_name || !source) {
            return res.status(400).json({ error: 'Missing required fields: job_id, job_name, and source are required' });
        }

        const id = uuidToBinary(uuidv4());
        const start_time = new Date();

        const connection = await pool.getConnection();
        try {
            await connection.query(
                `INSERT INTO scanner
        (id, job_id, job_name, source, start_time, status, parameters)
        VALUES (?, ?, ?, ?, ?, 'running', ?)`,
                [id, job_id, job_name, source, start_time, JSON.stringify(parameters || {})]
            );

            connection.release();
            return res.status(201).json({
                message: 'Scanner job started successfully',
                id: uuidv4(), // Return a readable UUID
                job_name,
                status: 'running',
            });
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error starting scanner job:', error);
        return res.status(500).json({ error: 'Failed to start scanner job', details: error.message });
    }
};

// Complete a scanner job with success
exports.completeScannerJob = async (req, res) => {
    try {
        const { id, result_data } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Missing required field: id' });
        }

        const end_time = new Date();
        const connection = await pool.getConnection();

        try {
            const [result] = await connection.query(
                `UPDATE scanner
        SET status = 'completed', end_time = ?, result_data = ?
        WHERE id = ? AND status = 'running'`,
                [end_time, JSON.stringify(result_data || {}), uuidToBinary(id)]
            );

            connection.release();

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Scanner job not found or not in running state' });
            }

            return res.status(200).json({
                message: 'Scanner job completed successfully',
                id,
                status: 'completed',
            });
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error completing scanner job:', error);
        return res.status(500).json({ error: 'Failed to complete scanner job', details: error.message });
    }
};

// Mark a scanner job as failed
exports.failScannerJob = async (req, res) => {
    try {
        const { id, error_message } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Missing required field: id' });
        }

        const end_time = new Date();
        const connection = await pool.getConnection();

        try {
            const [result] = await connection.query(
                `UPDATE scanner
        SET status = 'failed', end_time = ?, error_message = ?
        WHERE id = ? AND status = 'running'`,
                [end_time, error_message || 'Unknown error', uuidToBinary(id)]
            );

            connection.release();

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Scanner job not found or not in running state' });
            }

            return res.status(200).json({
                message: 'Scanner job marked as failed',
                id,
                status: 'failed',
            });
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error marking scanner job as failed:', error);
        return res.status(500).json({ error: 'Failed to update scanner job status', details: error.message });
    }
};

// Get scanner job details
exports.getScannerJob = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Missing required parameter: id' });
        }

        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query('SELECT * FROM scanner WHERE id = ?', [uuidToBinary(id)]);

            connection.release();

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Scanner job not found' });
            }

            return res.status(200).json(rows[0]);
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error retrieving scanner job:', error);
        return res.status(500).json({ error: 'Failed to retrieve scanner job', details: error.message });
    }
};
