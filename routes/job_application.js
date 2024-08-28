const express = require('express');
const { Pool } = require('pg');
const dbConfig = require('../read_replica_config'); // Adjust the path to your db_config.js file
const isAuthenticated = require('../jwtAuth.js');
const router = express.Router();

// Create a new PostgreSQL pool
const pool = new Pool(dbConfig);

router.get('/data/:job_post_id',isAuthenticated, async (req, res) => {
    try {
        // Check if the URL contains a job_post_id
        const job_post_id = req.params.job_post_id;

        if (!job_post_id) {
            return res.status(400).json({ error: 'Job Post ID not found in the URL parameters.' });
        }

        // Sanitize the job_post_id (assuming it should be an integer)
        const sanitizedJobPostId = parseInt(job_post_id, 10);

        if (isNaN(sanitizedJobPostId)) {
            return res.status(400).json({ error: 'Invalid Job Post ID.' });
        }

        // Retrieve college code from session or any other authentication mechanism
        const college_id = req.user.college;
        
        if (!college_id) {
            return res.status(400).json({ error: 'College code not found in session.' });
        }
        
        console.log(`Sanitized Job Post ID: ${sanitizedJobPostId}`);
        console.log(`College Code: ${college_id}`);

        // SQL query to fetch job application details based on job post ID
        const sql = `
        SELECT CONCAT(u.first_name, ' ', u.last_name) AS name, u.email, u.roll_number, c.name AS college_name, jp.company_title, jp.job_post_title
        FROM job_post_recruitment_status jprs
        INNER JOIN job_post jp ON jprs.job_post_id = jp.id
        INNER JOIN "user" u ON jprs.student_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        WHERE jp.id = $1 AND c.id = $2
        `;

        // Execute the query
        const result = await pool.query(sql, [sanitizedJobPostId, college_id]);

        // Fetch data from the result set
        const data = result.rows;

        // Send the JSON response
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});


module.exports = router;
