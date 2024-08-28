const express = require('express');
const AWS = require('aws-sdk');
const { Pool } = require('pg');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const cacheManager = require('../utlis/cacheManager.js');  // Ensure this path is correct
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig);


router.get('/emp_band_data',isAuthenticated, async (req, res) => {
    try {
        // Retrieve college code from session
        const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'college_id is not set in the session.' });
        }

        
        // Initialize arrays for counts
        const emp_band_counts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
        const best_band_counts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };

        // Fetch data for "Emp_Band" chart
        const sql_emp_band = `
            SELECT peb.employability_band, count(*) AS count
            FROM report.profiling_emp_bands peb
            INNER JOIN "user" u ON peb.user_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            WHERE c.id = $1 AND peb.employability_band IN ('A', 'B', 'C', 'D', 'F')
            GROUP BY peb.employability_band;
        `;

        const { rows: emp_band_rows } = await pool.query(sql_emp_band, [college_id]);
        emp_band_rows.forEach(row => {
            emp_band_counts[row.employability_band] = parseInt(row.count);
        });

        // Fetch data for "Best_Possible_Band" chart
        const sql_best_band = `
            SELECT peb.possible_employability_band, count(*) AS count
            FROM report.profiling_emp_bands peb
            INNER JOIN "user" u ON peb.user_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            WHERE c.id = $1 AND peb.possible_employability_band IN ('A', 'B', 'C', 'D', 'F')
            GROUP BY peb.possible_employability_band;
        `;

        const { rows: best_band_rows } = await pool.query(sql_best_band, [college_id]);
        best_band_rows.forEach(row => {
            best_band_counts[row.possible_employability_band] = parseInt(row.count);
        });

        // Prepare JSON response
        const response = {
            emp_band_counts,
            best_band_counts
        };

        
        // Output JSON
        res.json(response);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;
