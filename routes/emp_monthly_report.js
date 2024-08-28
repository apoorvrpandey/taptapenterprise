const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const cacheManager = require('../utlis/cacheManager.js'); // Ensure this path is correct
const isAuthenticated = require('../jwtAuth.js');

router.get('/month_wise_progress',isAuthenticated, async (req, res) => {
  try {
    // Retrieve college code from session
    const college_id = req.user.college || null;

    if (!college_id) {
      return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    // Check if data exists in DynamoDB cache
    const cacheKey = `month_wise_progress_${college_id}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Fetch data from the database
    const sql_emp_band = `
      SELECT
        TO_CHAR(TO_DATE(formatted_month, 'MM/YY'), 'Month YYYY') AS formatted_month,
        count(*) as student_count,
        ROUND(avg(total_score)) as avg_emp_score,
        ROUND(avg(aptitude)) as avg_apt_score,
        ROUND(avg(english)) as avg_eng_score,
        ROUND(avg(coding)) as avg_coding_score,
        SUM(CASE WHEN employability_band = 'A' THEN 1 ELSE 0 END) AS banda_count,
        SUM(CASE WHEN employability_band = 'B' THEN 1 ELSE 0 END) AS bandb_count,
        SUM(CASE WHEN employability_band = 'C' THEN 1 ELSE 0 END) AS bandc_count,
        SUM(CASE WHEN employability_band = 'D' THEN 1 ELSE 0 END) AS bandd_count,
        SUM(CASE WHEN employability_band = 'F' THEN 1 ELSE 0 END) AS bandf_count
      FROM
        report.profiling_month_scores
      INNER JOIN "user" on profiling_month_scores.user_id = "user".id
      INNER JOIN college on "user".college_id = college.id
      WHERE college.id = $1
      GROUP BY
        TO_CHAR(TO_DATE(formatted_month, 'MM/YY'), 'Month YYYY'),
        EXTRACT(YEAR FROM TO_DATE(formatted_month, 'MM/YY')),
        EXTRACT(MONTH FROM TO_DATE(formatted_month, 'MM/YY'))
      ORDER BY
        EXTRACT(YEAR FROM TO_DATE(formatted_month, 'MM/YY')),
        EXTRACT(MONTH FROM TO_DATE(formatted_month, 'MM/YY'));
    `;

    const { rows } = await pool.query(sql_emp_band, [college_id]);

    // Cache the data in DynamoDB with an expiry time
    await cacheManager.setCachedData(cacheKey, rows);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const refreshedData = await pool.query(sql_emp_band, [college_id]);
      if (refreshedData.rows.length > 0) {
        const newCacheData = refreshedData.rows;
        await cacheManager.setCachedData(cacheKey, newCacheData);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    // Output JSON
    res.json(rows);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
