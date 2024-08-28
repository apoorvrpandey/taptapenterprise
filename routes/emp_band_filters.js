const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig);

router.get('/emp_band_data', isAuthenticated, async (req, res) => {
    try {
        const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'College code is not set in the session.' });
        }

        const { degree, branch, year } = req.query;

        const emp_band_counts = { 'A++': 0, 'A+': 0, 'A': 0, 'B': 0, 'C': 0,F:0 };
        const best_band_counts =  { 'A++': 0, 'A+': 0, 'A': 0, 'B': 0, 'C': 0,F:0 };

        let filterConditions = [`c.id = $1`];
        let queryParams = [college_id];

        if (degree) {
            filterConditions.push(`education.degree = $${queryParams.length + 1}`);
            queryParams.push(degree);
        }

        if (branch) {
            filterConditions.push(`education.branch = $${queryParams.length + 1}`);
            queryParams.push(branch);
        }

        if (year) {
            filterConditions.push(`EXTRACT(YEAR FROM education.end_date) = $${queryParams.length + 1}`);
            queryParams.push(year);
        }

        const filterSQL = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

        const sql_combined = `
            WITH user_details AS (
                SELECT
                    u.id AS user_id,
                    u.email,
                    u.phone,
                    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                    c.name AS college_name,
                    education.degree,
                    education.branch,
                    EXTRACT(YEAR FROM education.end_date) AS end_year,
                    report.profiling_report_overall.employability_band,
                    report.profiling_report_overall.possible_employability_band,
                    ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY education.end_date DESC) AS rn
                FROM
                    report.profiling_report_overall
                INNER JOIN
                    "user" u ON report.profiling_report_overall.user_id = u.id
                INNER JOIN
                    college c ON u.college_id = c.id
                LEFT JOIN
                    resume.education_details education ON report.profiling_report_overall.user_id = education.user_id
                ${filterSQL}
            )
            SELECT
                user_id,
                email,
                phone,
                full_name,
                college_name,
                degree,
                branch,
                end_year,
                employability_band,
                possible_employability_band
            FROM
                user_details
            WHERE
                rn = 1;
        `;

        const { rows } = await pool.query(sql_combined, queryParams);

        rows.forEach(row => {
            if (row.employability_band && emp_band_counts.hasOwnProperty(row.employability_band)) {
                emp_band_counts[row.employability_band] += 1;
            }
            if (row.possible_employability_band && best_band_counts.hasOwnProperty(row.possible_employability_band)) {
                best_band_counts[row.possible_employability_band] += 1;
            }
        });

        const degreeQuery = `
            SELECT DISTINCT education.degree
            FROM resume.education_details education
            INNER JOIN "user" u ON education.user_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            INNER JOIN report.profiling_report_overall pro on u.id = pro.user_id
            WHERE c.id = $1;
        `;
        const branchQuery = `
            SELECT DISTINCT education.branch
            FROM resume.education_details education
            INNER JOIN "user" u ON education.user_id = u.id
            INNER JOIN college c ON u.college_id = c.id
             INNER JOIN report.profiling_report_overall pro on u.id = pro.user_id
            WHERE c.id = $1;
        `;
        const yearQuery = `
            SELECT DISTINCT EXTRACT(YEAR FROM education.end_date) AS year
            FROM resume.education_details education
            INNER JOIN "user" u ON education.user_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            INNER JOIN report.profiling_report_overall pro ON u.id = pro.user_id
            WHERE c.id = $1
            ORDER BY year DESC;

        `;

        const degrees = (await pool.query(degreeQuery, [college_id])).rows.map(row => row.degree);
        const branches = (await pool.query(branchQuery, [college_id])).rows.map(row => row.branch);
        const years = (await pool.query(yearQuery, [college_id])).rows.map(row => row.year);

        const response = {
            emp_band_counts,
            best_band_counts,
            filters: {
                degrees,
                branches,
                years
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;
