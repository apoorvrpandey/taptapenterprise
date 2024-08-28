const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');

// Database connection pool
const pool = new Pool(dbConfig);

// Endpoint to fetch data for the college leaderboard (Average Score)
router.get('/data',isAuthenticated, async (req, res) => {
    const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'college_id is not set in the session.' });
        }
    try {
        // Get a client from the connection pool
        const client = await pool.connect();

        // Query to fetch college data
        const query = `
            SELECT
                c.id,
                c.name
            FROM
                report.college c
            WHERE
                c.name != '' and c.id = $1`;

        // Execute the query
        const result = await client.query(query,[college_id]);

        // Release the client back to the pool
        client.release();

        // Map the query result to desired format
        const overallData = result.rows.map((row, index) => ({
            collegeID: parseInt(row.id),
            collegeName: row.name
        }));

        // Send the JSON response
        res.json(overallData);
    } catch (error) {
        console.error('Error fetching college data:', error);
        // Send appropriate error response
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
