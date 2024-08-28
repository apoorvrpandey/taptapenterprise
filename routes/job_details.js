const { Pool } = require('pg');
const express = require('express');
const router = express.Router();
const dbConfig = require('../read_replica_config');
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');

router.get('/job_post_data', async (req, res) => {
    try {
        // Query 1: Count of distinct company titles
        const query1 = `
            SELECT COUNT(DISTINCT company_title) AS company_count
            FROM job_post
            WHERE drive_type = 'Open Drive' AND status = 'published';
        `;
        const { rows: rows1 } = await pool.query(query1);
        const company_count = rows1[0]?.company_count || 0;

        // Query 2: Count of distinct job post titles
        const query2 = `
            SELECT COUNT(DISTINCT job_post_title) AS job_post_count
            FROM job_post
            WHERE drive_type = 'Open Drive' AND status = 'published';
        `;
        const { rows: rows2 } = await pool.query(query2);
        const job_post_count = rows2[0]?.job_post_count || 0;

        // Query 3: Average CTC offered
        const query3 = `
            SELECT ROUND(AVG((job_post.min_salary_lpa + job_post.max_salary_lpa) / 2), 2) AS avg_ctct_offered
            FROM job_post
            WHERE status = 'published' AND drive_type = 'Open Drive';
        `;
        const { rows: rows3 } = await pool.query(query3);
        const avg_ctct_offered = rows3[0]?.avg_ctct_offered || 0;

        // Prepare data for JSON response
        const data = {
            company_count,
            job_post_count,
            avg_ctct_offered
        };

        // Output JSON
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;
