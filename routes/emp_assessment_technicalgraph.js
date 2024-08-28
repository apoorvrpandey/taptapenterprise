const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const cacheManager = require('../utlis/cacheManager.js');
const isAuthenticated = require('../jwtAuth.js');

async function fetchSubDomainStatsFromDB(college_id, hackathon_id) {
  const sql = `
    SELECT 
      sda.sub_domain,
      ROUND(AVG(sda.accuracy), 2) AS average_accuracy
    FROM 
      report.assessment_subdomain_accuracy sda
    JOIN 
      "user" u ON sda.user_id = u.id
    JOIN 
      college c ON u.college_id = c.id
    JOIN 
      hackathon h ON sda.hackathon_id = h.id
    WHERE 
      c.id = $1 AND h.id = $2
    GROUP BY 
      sda.sub_domain
    ORDER BY 
      average_accuracy DESC
  `;

  try {
    const result = await pool.query(sql, [college_id, hackathon_id]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching sub-domain stats:', error);
    throw error;
  }
}

async function fetchCodingSubmissionsFromDB(college_id) {
  const sql = `
    WITH coding_submissions AS (
      SELECT ts.user_id,
             ts.round_id,
             ts.problem_id,
             replace(replace(p.sub_domain::text, '{'::text, ''::text), '}'::text, ''::text) AS sub_domain,
             r.hackathon_id,
             ts.status,
             ts.language,
             ts.type
      FROM test_submission ts
               JOIN problem p ON ts.problem_id = p.id
               JOIN round r ON ts.round_id = r.id
               JOIN hackathon h ON r.hackathon_id = h.id
      WHERE (h.test_type_id = ANY (ARRAY [6, 54]))
        AND ts.type = 'coding'::text
        AND ts.create_at >= '2023-09-01'::date
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
      c.id = $1
    GROUP BY
      sub_domain
  `;

  try {
    const result = await pool.query(sql, [college_id]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching coding submissions:', error);
    throw error;
  }
}

router.get('/data/:id', isAuthenticated, async (req, res) => {
  try {
    const college_id = req.user.college || null;
    const hackathon_id = req.params.id || null;

    if (!college_id) {
      return res.status(400).json({ error: 'college_id is not set in the session.' });
    }

    if (!hackathon_id) {
      return res.status(400).json({ error: 'hackathon_id is not provided in the URL.' });
    }

    const cacheKey = `data_empaccuracyanalysis_${college_id}_${hackathon_id}`;
    let cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const [subDomainStats, codingSubmissions] = await Promise.all([
      fetchSubDomainStatsFromDB(college_id, hackathon_id),
      fetchCodingSubmissionsFromDB(college_id)
    ]);

    cachedData = {
      sub_domain_stats: subDomainStats,
      coding_submissions: codingSubmissions
    };

    await cacheManager.setCachedData(cacheKey, cachedData);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const [refreshedSubDomainStats, refreshedCodingSubmissions] = await Promise.all([
        fetchSubDomainStatsFromDB(college_id, hackathon_id),
        fetchCodingSubmissionsFromDB(college_id)
      ]);

      const refreshedData = {
        sub_domain_stats: refreshedSubDomainStats,
        coding_submissions: refreshedCodingSubmissions
      };

      await cacheManager.setCachedData(cacheKey, refreshedData);
      console.log(`Cache refreshed for key ${cacheKey}`);
    });

    res.json(cachedData);
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
