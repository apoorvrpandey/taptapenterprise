const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../read_replica_config.js');
const cacheManager = require('../utlis/cacheManager.js');
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig);

// Route to get the count of students with accuracy <= 50 for each sub_domain
router.get('/student-counts', isAuthenticated,async (req, res) => {
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  try {
    const cacheKey = `student-counts-${college_id}`;
    let cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT
        sda.sub_domain,
        COUNT(CASE WHEN sda.accuracy <= 50 THEN 1 END) AS count_of_students
      FROM
        report.profiling_sub_domain_accuracy sda
      JOIN
        "user" u ON sda.user_id = u.id
      JOIN
        college c ON u.college_id = c.id
      WHERE
        c.id = $1
      GROUP BY
        sda.sub_domain
      ORDER BY
        count_of_students DESC;
    `;
    const { rows } = await pool.query(query, [college_id]);
    cachedData = rows;
    await cacheManager.setCachedData(cacheKey, cachedData);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const { rows: refreshedData } = await pool.query(query, [college_id]);
      if (refreshedData.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedData);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.json(cachedData);
  } catch (err) {
    console.error('Error fetching student counts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get the list of students for a specific sub_domain with accuracy <= 50
router.get('/students/:sub_domain', isAuthenticated, async (req, res) => {
  const { sub_domain } = req.params;
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  try {
    const cacheKey = `students-${sub_domain}-${college_id}`;
    let cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT
        concat(u.first_name, ' ', u.last_name) AS name,
        u.email,
        ROUND(pro.coding, 2) AS coding,
        ROUND(pro.total_score, 2) AS total_score,
        pro.employability_band
      FROM
        report.profiling_sub_domain_accuracy sda
      INNER JOIN
        report.profiling_report_overall pro ON sda.user_id = pro.user_id
      JOIN
        "user" u ON sda.user_id = u.id
      JOIN
        college c ON u.college_id = c.id
      WHERE
        c.id = $2
        AND sda.sub_domain = $1
        AND sda.accuracy <= 50;
    `;
    const { rows } = await pool.query(query, [sub_domain, college_id]);
    cachedData = rows;
    await cacheManager.setCachedData(cacheKey, cachedData);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const { rows: refreshedData } = await pool.query(query, [sub_domain, college_id]);
      if (refreshedData.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedData);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.json(cachedData);
  } catch (err) {
    console.error(`Error fetching students for sub_domain ${sub_domain}:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
