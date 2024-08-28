const { Pool } = require('pg');
const express = require('express');
const router = express.Router();
const dbConfig = require('../read_replica_config');
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig);

router.get('/all_data',isAuthenticated, async (req, res) => {
    const college_id = req.user.college || null;

    if (!college_id) {
        return res.status(400).json({ error: 'College college_id is not set in the session.' });
    }

    try {
        const { driveType, company, salaryRange, employmentType } = req.query;

        const sqlDriveTypes = `
            SELECT DISTINCT drive_type
            FROM job_post
            INNER JOIN job_post_recruitment_status jprs on job_post.id = jprs.job_post_id
            INNER JOIN "user" u on jprs.student_id = u.id
            INNER JOIN college c on u.college_id = c.id   
            WHERE c.id = $1
              AND status = 'published'
              ${driveType ? ` AND drive_type = '${driveType}'` : ''};
        `;

        const sqlCompanies = `
            SELECT DISTINCT company_title
            FROM job_post
            INNER JOIN job_post_recruitment_status jprs on job_post.id = jprs.job_post_id
            INNER JOIN "user" u on jprs.student_id = u.id
            INNER JOIN college c on u.college_id = c.id   
            WHERE c.id = $1
              AND status = 'published'
              ${company ? ` AND company_title = '${company}'` : ''};
        `;

        const sqlPackage = `
            SELECT DISTINCT
                CASE
                    WHEN is_ctc_required = TRUE THEN CONCAT(min_salary_lpa, ' LPA - ', max_salary_lpa, ' LPA')
                    ELSE 'Not disclosed'
                END AS salary_range_or_not_disclosed
            FROM job_post
            INNER JOIN job_post_recruitment_status jprs on job_post.id = jprs.job_post_id
            INNER JOIN "user" u on jprs.student_id = u.id
            INNER JOIN college c on u.college_id = c.id   
            WHERE c.id = $1
              AND status = 'published'
              ${salaryRange ? ` AND (min_salary_lpa >= ${salaryRange.split('-')[0]} AND max_salary_lpa <= ${salaryRange.split('-')[1]})` : ''};
        `;

        const sqlEmploymentTypes = `
            SELECT DISTINCT employment_type
            FROM job_post
            INNER JOIN job_post_recruitment_status jprs on job_post.id = jprs.job_post_id
            INNER JOIN "user" u on jprs.student_id = u.id
            INNER JOIN college c on u.college_id = c.id   
            WHERE c.id = $1
              AND status = 'published'
              ${employmentType ? ` AND employment_type = '${employmentType}'` : ''};
        `;

        const [driveTypesResult, companiesResult, packageResult, employmentTypesResult] = await Promise.all([
            pool.query(sqlDriveTypes, [college_id]),
            pool.query(sqlCompanies, [college_id]),
            pool.query(sqlPackage, [college_id]),
            pool.query(sqlEmploymentTypes, [college_id])
        ]);

        const driveTypes = driveTypesResult.rows.map(row => row.drive_type);
        const companies = companiesResult.rows.map(row => row.company_title);
        const package = packageResult.rows.map(row => row.salary_range_or_not_disclosed);
        const employmentTypes = employmentTypesResult.rows.map(row => row.employment_type);

        const allData = {
            driveTypes,
            companies,
            package,
            employmentTypes
        };

        res.json(allData);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

router.get('/job_posts',isAuthenticated, async (req, res) => {
    const college_id = req.user.college || null;

    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    try {
        const { driveTypes, salaryRanges, employmentTypes, companies } = req.query;

        let sql = `
            SELECT
                jp.id AS job_post_id,
                jp.company_title,
                to_char(jp.create_at, 'YYYY-MM-DD') AS create_at,
                jp.drive_type,
                jp.job_post_title,
                jp.job_post_logo_url,
                jp.description,
                CASE
                    WHEN jp.is_ctc_required = TRUE THEN CONCAT(jp.min_salary_lpa, ' LPA - ', jp.max_salary_lpa, ' LPA')
                    ELSE 'Not disclosed'
                END AS salary_range_or_not_disclosed,
                jp.employment_type,
                jp.office_mode,
                jp.open_drive_link,
                COALESCE(counts.count, 0) AS drive_count
            FROM
                job_post jp
            LEFT JOIN
                (
                    SELECT
                        jpr.job_post_id,
                        COUNT(jpr.student_id) AS count
                    FROM
                        job_post_recruitment_status jpr
                    INNER JOIN
                        job_post jp2 ON jpr.job_post_id = jp2.id
                    INNER JOIN
                        "user" u ON jpr.student_id = u.id
                    INNER JOIN
                        college c ON u.college_id = c.id
                    WHERE
                        c.id = $1
                    GROUP BY
                        jpr.job_post_id
                ) AS counts ON jp.id = counts.job_post_id
            WHERE
                jp.status = 'published'
                AND COALESCE(counts.count, 0) > 0
        `;

        const queryParams = [college_id];
        let filterIndex = 2; // Start from 2 because 1 is used for college_code

        if (driveTypes) {
            sql += ` AND jp.drive_type = ANY($${filterIndex})`;
            queryParams.push(driveTypes.split(','));
            filterIndex++;
        }
        if (salaryRanges) {
            const salaryConditions = salaryRanges.split(',').map((range, index) => {
                const [min, max] = range.split(' LPA - ');
                queryParams.push(parseFloat(min), parseFloat(max));
                return `(jp.min_salary_lpa >= $${filterIndex + index * 2} AND jp.max_salary_lpa <= $${filterIndex + index * 2 + 1})`;
            });
            sql += ` AND (${salaryConditions.join(' OR ')})`;
            filterIndex += salaryConditions.length * 2;
        }
        if (employmentTypes) {
            sql += ` AND jp.employment_type = ANY($${filterIndex})`;
            queryParams.push(employmentTypes.split(','));
            filterIndex++;
        }
        if (companies) {
            sql += ` AND jp.company_title = ANY($${filterIndex})`;
            queryParams.push(companies.split(','));
            filterIndex++;
        }

        const { rows } = await pool.query(sql, queryParams);

        res.json(rows);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;