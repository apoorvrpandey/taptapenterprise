const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const cacheManager = require('../utlis/cacheManager');
const isAuthenticated = require('../jwtAuth.js');


router.get('/coding_submissions',isAuthenticated, async (req, res) => {
  try {
    // Check if the college code is set in the session
    const college_id = req.user.college || null;

    if (!college_id) {
      return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    // Check if data exists in cache
    const cacheKey = `coding_submissions_${college_id}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);
  
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // SQL query to fetch the required data
    const sql = `
      WITH coding_submissions AS (
        SELECT
          ts.user_id,
          ts.round_id,
          ts.problem_id,
          replace(replace(p.sub_domain::text, '{'::text, ''::text), '}'::text, ''::text) AS sub_domain,
          r.hackathon_id,
          ts.status,
          ts.language,
          ts.type
        FROM
          test_submission ts
        JOIN
          problem p ON ts.problem_id = p.id
        JOIN
          round r ON ts.round_id = r.id
        JOIN
          hackathon h ON r.hackathon_id = h.id
        WHERE
          (h.test_type_id = ANY (ARRAY [6, 54])) AND
          ts.type = 'coding' AND
          ts.create_at >= '2023-09-01'::date
      )
      SELECT
        sub_domain,
        COUNT(problem_id) AS total_submissions,
        SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) AS successful_submissions
      FROM
        coding_submissions
      JOIN
        "user" u ON user_id = u.id
      JOIN
        college c ON u.college_id = c.id
      WHERE
        c.is = $1
      GROUP BY
        sub_domain, c.code;
    `;

    // Execute the query with parameter binding
    const { rows } = await pool.query(sql, [college_id]);

    // Cache the data in DynamoDB
    await cacheManager.setCachedData(cacheKey, rows); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool.query(sql, [college_id]);
        if (refreshedData.rows.length > 0) {
          const rows = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, rows);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });
    // Send the response
    res.json(rows);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
