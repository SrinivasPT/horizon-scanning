const pool = require('./database');

/**
 * Execute a database operation with automatic connection management.
 * This function handles connection acquisition, release, and error handling.
 *
 * @param operation Function that performs the database operation
 * @returns The result of the database operation
 */
async function withConnection(operation) {
    const connection = await pool.getConnection();
    try {
        return await operation(connection);
    } finally {
        connection.release();
    }
}

module.exports = { withConnection };
