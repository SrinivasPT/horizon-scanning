const pool = require('../db/database');
// Removed UUID imports since we're using BIGINT now

// Start a new scanner job
exports.startScannerJob = async (req, res) => {
    try {
        const { job_id, job_name, source } = req.body;

        if (!job_id || !job_name || !source) {
            return res.status(400).json({ error: 'Missing required fields: job_id, job_name, and source are required' });
        }

        // No need to generate UUID, database will use auto-increment or we'd provide a number directly

        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                `INSERT INTO scanner (job_id, job_name, source, start_time, status)
                VALUES (?, ?, ?, ?, 'RUNNING')`,
                [job_id, job_name, source, new Date()]
            );

            connection.release();
            // Get the auto-generated ID
            const id = result.insertId;
            return res.status(201).json({ message: 'Scanner job started successfully', id, job_name, status: 'RUNNING' });
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error starting scanner job:', error.message);
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
                SET status = 'COMPLETED', end_time = ?, result_data = ?
                WHERE id = ? AND status = 'RUNNING'`,
                [end_time, JSON.stringify(result_data || {}), id] // No need to convert ID
            );

            connection.release();

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'UPDATE: Scanner job not found or not in running state' });
            }

            return res.status(200).json({ message: 'Scanner job completed successfully', id, status: 'COMPLETED' });
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
        SET status = 'FAILED', end_time = ?, error_message = ?
        WHERE id = ? AND status = 'RUNNING'`,
                [end_time, error_message || 'Unknown error', id] // No need to convert ID
            );

            connection.release();

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'FAILED: Scanner job not found or not in running state' });
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
            const [rows] = await connection.query('SELECT * FROM scanner WHERE id = ?', [id]); // No need to convert ID

            connection.release();

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Scanner job not found' });
            }

            // No need to convert ID in the response
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
