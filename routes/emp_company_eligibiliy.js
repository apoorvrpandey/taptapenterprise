const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');
const cacheManager = require('../utlis/cacheManager.js'); // Ensure this path is correct

router.get('/data',isAuthenticated, async (req, res) => {
    try {
        // Check if the college code is set in the session
        const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'College code is not set in the session.' });
        }

        // SQL query to fetch the required data
        const sql = `
            WITH user_report AS (
                SELECT
                    us.user_id,
                    us.question_subdomain,
                    SUM(us.obtained_score) AS total_obtained_score,
                    SUM(us.question_score) AS total_question_score
                FROM
                    test_submission_with_score us
                JOIN
                    "user" ut ON us.user_id = ut.id
                JOIN
                    college c ON ut.college_id = c.id
                WHERE
                    c.id = $1
                GROUP BY
                    us.user_id, us.question_subdomain
            ),
            subdomains_with_minimum_eighty_percent_accuracy AS (
                SELECT
                    user_id,
                    array_agg(question_subdomain) AS subDomains
                FROM
                    user_report
                WHERE
                    ROUND((total_obtained_score / NULLIF(total_question_score, 0) * 100), 2) > 80
                GROUP BY
                    user_id
            ),
            company_subdomains AS (
                SELECT
                    c.name AS company_name,
                    array_agg(sd.name) AS company_subDomains
                FROM
                    company_sub_domain csd
                JOIN
                    company c ON csd.company_id = c.id
                JOIN
                    question_sub_domain sd ON csd.sub_domain_id = sd.id
                GROUP BY
                    c.name
            ),
            user_company_eligibility AS (
                SELECT
                    sa.user_id,
                    cs.company_name,
                    cs.company_subDomains,
                    sa.subDomains AS user_subDomains,
                    ARRAY(
                        SELECT UNNEST(cs.company_subDomains)
                        INTERSECT
                        SELECT UNNEST(sa.subDomains)
                    ) AS matched_subDomains,
                    ARRAY_LENGTH(ARRAY(
                        SELECT UNNEST(cs.company_subDomains)
                        INTERSECT
                        SELECT UNNEST(sa.subDomains)
                    ), 1) AS matched_count,
                    ARRAY_LENGTH(cs.company_subDomains, 1) AS total_company_subDomains
                FROM
                    subdomains_with_minimum_eighty_percent_accuracy sa
                CROSS JOIN
                    company_subdomains cs
            )
            SELECT
                company_name,
                SUM(CASE WHEN isEligible THEN 1 ELSE 0 END) AS eligible_count,
                SUM(CASE WHEN NOT isEligible THEN 1 ELSE 0 END) AS ineligible_count
            FROM
            (
                SELECT
                    user_id,
                    company_name,
                    CASE
                        WHEN (matched_count::numeric / total_company_subDomains) * 100 >= 60 THEN true
                        ELSE false
                    END AS isEligible
                FROM
                    user_company_eligibility
            ) AS eligibility_status
            GROUP BY
                company_name;
        `;

        // Execute the query with parameter binding
        const { rows } = await pool.query(sql, [college_id]);

        
        // Send the response
        res.json(rows);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;
