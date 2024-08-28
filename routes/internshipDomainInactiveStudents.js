// server.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);
const xlsx = require('node-xlsx').default;
const isAuthenticated = require('../jwtAuth.js');

router.get('/assessments/:domainId',isAuthenticated, async (req, res) => {
    const domainId = req.params.domainId;
    const college_id = req.user.college;
        
    if (!college_id) {
         return res.status(400).json({ error: 'College code not found in session.' });
    }

    try {
        const overviewQuery = `
            SELECT
            bd.name,
            bd.regno,
            bd.email,
            COUNT(uhp.user_id) AS response_count
        FROM
            report.internships i
            INNER JOIN report.internship_domain id ON i.id = id.internship_id
            INNER JOIN report.internship_assessment ia on id.id = ia.domain_id
            INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
            INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
            LEFT JOIN "user" u on bd.email = u.email
            LEFT JOIN user_hackathon_participation uhp on u.id = uhp.user_id and ia.assessment_id = uhp.hackathon_id
            INNER JOIN college c on bd.college_id = c.id
        WHERE
            id.id = $1 and c.id = $2
        GROUP BY
            bd.name,
            bd.regno,
            bd.email
        HAVING COUNT(uhp.user_id) = 0;`;

        const { rows } = await pool1.query(overviewQuery, [domainId,college_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching trainings:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

router.get('/events/:domainId',isAuthenticated, async (req, res) => {
    const domainId = req.params.domainId;
    const college_id = req.user.college;

    if (!college_id) {
         return res.status(400).json({ error: 'College code not found in session.' });
    }

    try {
        const overviewQuery = `
            SELECT
                bd.name,
                bd.regno,
                bd.email,
                COUNT(sr.registration_number) AS response_count
            FROM
                report.internships i
                INNER JOIN report.internship_domain id ON i.id = id.internship_id
                INNER JOIN report.internship_live_sessions ils ON id.id = ils.domain_id
                INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
                INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
                LEFT JOIN report.student_responses sr ON bd.regno = sr.registration_number
                                                    AND ils.event_id = sr.event_id
                INNER JOIN college c on bd.college_id = c.id
            WHERE
                id.id = $1 and c.id = $2
            GROUP BY
                bd.name,
                bd.regno,
                bd.email
            HAVING COUNT(sr.registration_number) = 0;`;

        const { rows } = await pool1.query(overviewQuery, [domainId, college_id]);
        
        if (rows.length === 0) {
            return res.status(200).json({ message: 'No data is available' }); // Return a message
        }
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching trainings:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});



module.exports = router;
