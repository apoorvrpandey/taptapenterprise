const express = require('express');
const { Pool } = require('pg');
const cacheManager = require('../utlis/cacheManager'); // Ensure this module exists and handles caching
const isAuthenticated = require('../jwtAuth.js');
const dbConfig = require('../read_replica_config'); // Assuming this file exists and contains your PostgreSQL database configuration
const pool = new Pool(dbConfig);

const router = express.Router();

// Route to fetch job post data
router.get('/job_post_data', isAuthenticated, async (req, res) => {
    const college_id = req.user.college || null;

    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    const cacheKey = `job_post_data_${college_id}`;

    try {
        // Check if cached data exists
        let cachedData = await cacheManager.getCachedData(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Fetch data from the database
        const query1 = `
            SELECT COUNT(*) AS total_job_applications
            FROM job_post_recruitment_status jprs
            INNER JOIN job_post jp ON jprs.job_post_id = jp.id
            INNER JOIN "user" u ON jprs.student_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            WHERE c.id = $1
        `;
        const result1 = await pool.query(query1, [college_id]);
        const total_job_applications = result1.rows[0].total_job_applications;

        const query2 = `
            SELECT TO_CHAR(jp.application_start_date, 'Month YYYY') AS month_year,
                   COUNT(*) AS post_count
            FROM job_post jp
            INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
            INNER JOIN "user" u ON jprs.student_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            WHERE jp.drive_type = 'Open Drive'
              AND jp.status = 'published'
              AND c.id = $1
            GROUP BY month_year
        `;
        const result2 = await pool.query(query2, [college_id]);
        const monthly_job_post_count = result2.rows;

        const query3 = `
            SELECT COUNT(*) AS total_published_job_posts
            FROM job_post jp
            INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
            INNER JOIN "user" u ON jprs.student_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            WHERE jp.drive_type = 'Open Drive'
              AND jp.status = 'published'
              AND c.id = $1
        `;
        const result3 = await pool.query(query3, [college_id]);
        const total_published_job_posts = result3.rows[0].total_published_job_posts;

        const data = {
            total_job_applications,
            monthly_job_post_count,
            total_published_job_posts
        };

        // Cache the data
        await cacheManager.setCachedData(cacheKey, data);

        // Schedule automatic cache refresh
        cacheManager.scheduleCacheRefresh(cacheKey, async () => {
            const refreshedResult1 = await pool.query(query1, [college_id]);
            const refreshedTotalJobApplications = refreshedResult1.rows[0].total_job_applications;

            const refreshedResult2 = await pool.query(query2, [college_id]);
            const refreshedMonthlyJobPostCount = refreshedResult2.rows;

            const refreshedResult3 = await pool.query(query3, [college_id]);
            const refreshedTotalPublishedJobPosts = refreshedResult3.rows[0].total_published_job_posts;

            return {
                total_job_applications: refreshedTotalJobApplications,
                monthly_job_post_count: refreshedMonthlyJobPostCount,
                total_published_job_posts: refreshedTotalPublishedJobPosts
            };
        });

        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

// Route to fetch count of job applications
router.get('/applied_count',isAuthenticated, async (req, res) => {
    const college_id = req.user.college || null;

    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    const cacheKey = `applied_count_${college_id}`;

    try {
        let cachedData = await cacheManager.getCachedData(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const sql = `
            SELECT COUNT(jprs.student_id) AS applied_count
            FROM job_post
            INNER JOIN job_post_recruitment_status jprs ON job_post.id = jprs.job_post_id
            INNER JOIN "user" u ON jprs.student_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            WHERE c.id = $1
        `;
        const { rows } = await pool.query(sql, [college_id]);

        const data = rows[0];

        await cacheManager.setCachedData(cacheKey, data);

        cacheManager.scheduleCacheRefresh(cacheKey, async () => {
            const refreshedRows = await pool.query(sql, [college_id]);
            return refreshedRows.rows[0];
        });

        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

// Route to fetch job post to application ratio
router.get('/job_post_ratio', isAuthenticated, async (req, res) => {
    const college_id = req.user.college || null;

    if (!college_id) {
        return res.status(400).json({ error: 'College college_id is not set in the session.' });
    }

    const cacheKey = `job_post_ratio_${college_id}`;

    try {
        let cachedData = await cacheManager.getCachedData(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const query = `
            SELECT COUNT(jprs.student_id)::float / COUNT(jp.id) AS ratio
            FROM job_post jp
            INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
            INNER JOIN "user" u ON jprs.student_id = u.id
            INNER JOIN college c ON u.college_id = c.id
            WHERE c.id = $1
        `;
        const result = await pool.query(query, [college_id]);
        const ratio = result.rows[0].ratio;

        const data = { ratio };

        await cacheManager.setCachedData(cacheKey, data);

        cacheManager.scheduleCacheRefresh(cacheKey, async () => {
            const refreshedResult = await pool.query(query, [college_id]);
            return { ratio: refreshedResult.rows[0].ratio };
        });

        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;
