const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');

// Database connection pool
const pool = new Pool(dbConfig);

// Endpoint to fetch data for the college leaderboard (Average Score)
router.get('/internship_type', async (req, res) => {
    try {
        // Get a client from the connection pool
        const client = await pool.connect();

        // Query to fetch college data
        const query = `
            SELECT
                it.id,
                it.internship_types
            FROM
                report.internship_type it
            WHERE
            it.internship_types != ''`;

        // Execute the query
        const result = await client.query(query);

        // Release the client back to the pool
        client.release();

        // Map the query result to desired format
        const overallData = result.rows.map((row, index) => ({
            internshiptypeID: parseInt(row.id),
            internshiptypeName: row.internship_types
        }));

        // Send the JSON response
        res.json(overallData);
    } catch (error) {
        console.error('Error fetching internship_type data:', error);
        // Send appropriate error response
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router;
