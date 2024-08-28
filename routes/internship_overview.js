const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);
const cacheManager = require('../utlis/cacheManager');

  router.get('/internship/:id', async (req, res) => {
    const internshipId = req.params.id;
  
    try {
      const selectQuery = `
      SELECT
      it.title,
      it.description,
      it.total_hours,
      it.internship_type_id,
      start_date,
      end_date,
      banner
      FROM report.internships it
        WHERE it.id = $1
      `;
      const result = await pool.query(selectQuery, [internshipId]);
      
      if (result.rows.length === 0) {
        return res.status(404).send('internship not found');
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error retrieving internship:', error.message);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  });


// API endpoint to get internship details  ID
router.get('/internship_details/:id', async (req, res) => {
  const internshipId = req.params.id;
    
  try {
    const query = `
      SELECT 
        id,
        title,
        description,
        total_hours,
        internship_type_id,
        start_date,
        end_date,
        banner
      FROM 
        report.internships
      WHERE 
        id = $1
    `;

    const result = await pool.query(query, [internshipId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Internship not found');
    }

    const internship = result.rows[0];
    res.status(200).json(internship);
  } catch (error) {
    console.error('Error fetching internship details:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/batch_count/:id',isAuthenticated, async (req, res) => {
  const internshipId = req.params.id;
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  const cacheKey = `batch_count_${internshipId}_${college_id}`;

  try {
    const cachedData = await cacheManager.getCachedData(cacheKey);
  
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT COUNT(*) as count
      FROM report.batch_data bd
        INNER JOIN report.internship_batch ib ON bd.batch_id = ib.batch_id
        INNER JOIN report.internship_domain id ON ib.domain_id = id.id
        INNER JOIN report.internships i ON id.internship_id = i.id
        INNER JOIN report.college c ON bd.college_id = c.id
      WHERE i.id = $1 AND c.id = $2
      order by count desc
    `;
    const result = await pool.query(query, [internshipId, college_id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Internship not found');
    }

    const batchCount = result.rows[0].count;

    // Cache the data
    await cacheManager.setCachedData(cacheKey, { batchCount });

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const refreshedResult = await pool.query(query, [internshipId, college_id]);
      if (refreshedResult.rows.length > 0) {
        const refreshedBatchCount = refreshedResult.rows[0].count;
        await cacheManager.setCachedData(cacheKey, { batchCount: refreshedBatchCount });
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.status(200).json({ batchCount });
  } catch (error) {
    console.error('Error fetching batch count:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/batch_details/:id',isAuthenticated, async (req, res) => {
  const internshipId = req.params.id;
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  try {
    const cacheKey = `batch_details_${internshipId}_${college_id}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT 
    b.batch_title AS batch, 
    COUNT(*) AS count
FROM 
    report.batch_data bd
INNER JOIN 
    report.batch b ON bd.batch_id = b.id
INNER JOIN 
    report.internship_batch ib ON bd.batch_id = ib.batch_id
INNER JOIN 
    report.internship_domain id ON ib.domain_id = id.id
INNER JOIN 
    report.internships i ON id.internship_id = i.id
INNER JOIN 
    report.college c ON bd.college_id = c.id
WHERE 
    i.id = $1 AND c.id = $2
GROUP BY 
    b.batch_title 
HAVING 
    COUNT(*) > 5
ORDER BY 
    count DESC;

    `;
    const result = await pool.query(query, [internshipId, college_id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Batch Details not found');
    }

    // Cache the result
    await cacheManager.setCachedData(cacheKey, result.rows);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const refreshedResult = await pool.query(query, [internshipId, college_id]);
      if (refreshedResult.rows.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedResult.rows);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/batch_students_data/:id',isAuthenticated, async (req, res) => {
  const internshipId = req.params.id;
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  try {
    const cacheKey = `batch_students_data_${internshipId}_${college_id}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);
  
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT b.batch_title AS batch_name, bd.name AS student_name, bd.email, bd.regno, bd.phone 
      FROM report.batch_data bd
        INNER JOIN report.batch b ON bd.batch_id = b.id
        INNER JOIN report.internship_batch ib ON bd.batch_id = ib.batch_id
        INNER JOIN report.internship_domain id ON ib.domain_id = id.id
        INNER JOIN report.internships i ON id.internship_id = i.id
        INNER JOIN report.college c ON bd.college_id = c.id
      WHERE i.id = $1 AND c.id = $2;
    `;
    const result = await pool.query(query, [internshipId, college_id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Student Details not found');
    }

    // Cache the result
    await cacheManager.setCachedData(cacheKey, result.rows);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const refreshedResult = await pool.query(query, [internshipId, college_id]);
      if (refreshedResult.rows.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedResult.rows);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching Student details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/graph_details/:id', async (req,res) => {
  const internshipId = req.params.id;

  try {
    const query = `
    WITH DomainSummary AS (
      SELECT
          i.id AS internship_id,
          SUM(id.live_sessions + id.student_reviews + id.mock_interviews) AS total_live_sessions
      FROM
          report.internship_domain id
      INNER JOIN
          report.internships i ON id.internship_id = i.id
      GROUP BY
          i.id
  ),
  EventCount AS (
      SELECT
          i.id AS internship_id,
          COUNT(ils.event_id) AS total_event_count
      FROM
          report.internship_live_sessions ils
      INNER JOIN
         report.internship_domain id on ils.domain_id = id.id
      INNER JOIN
         report.internships i on id.internship_id = i.id
      GROUP BY
          i.id
  ),
  DomainAssessments AS (
      SELECT
          internship_id,
          SUM(assessments) AS total_assessments
      FROM
          report.internship_domain id
      GROUP BY
          internship_id
  ),
  AssessmentDetails AS (
      SELECT
          i.id AS internship_id,
          COUNT(ia.assessment_id) AS assessment_count,
          COUNT(CASE WHEN h.test_type_id = 13 THEN 1 END) AS daily_tests,
          COUNT(CASE WHEN h.test_type_id = 81 THEN 1 END) AS grand_tests,
          COUNT(CASE WHEN h.test_type_id = 80 THEN 1 END) AS assignments
      FROM
          report.internship_assessment ia
      INNER JOIN
          report.internship_domain id ON ia.domain_id = id.id
      INNER JOIN
          hackathon h ON ia.assessment_id = h.id
      INNER JOIN
          test_type ON h.test_type_id = test_type.id
      INNER JOIN
          report.internships i ON id.internship_id = i.id
      GROUP BY
        i.id
  )
  SELECT
      ds.total_live_sessions,
      ec.total_event_count,
      pa.total_assessments,
      ad.assessment_count,
      ad.daily_tests,
      ad.grand_tests,
      ad.assignments
  FROM
      DomainSummary ds
  INNER JOIN
      EventCount ec ON ds.internship_id = ec.internship_id
  INNER JOIN
      DomainAssessments pa ON ds.internship_id = pa.internship_id
  INNER JOIN
      AssessmentDetails ad ON ds.internship_id = ad.internship_id
  WHERE
      ds.internship_id = $1;
    `;

    const result = await pool1.query(query, [internshipId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data not found' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/table_details/:id', isAuthenticated, async (req, res) => {
  const internshipId = req.params.id;
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  try {
    const cacheKey = `table_details_${internshipId}_${college_id}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);
  
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      WITH domain_data AS (
        SELECT
          id.id,
          id.title,
          id.internship_id,
          count(bd.batch_id)

        FROM
          report.internship_domain id
            INNER JOIN report.internship_batch ib on id.id = ib.domain_id
            INNER JOIN report.batch_data bd on ib.batch_id = bd.batch_id
            INNER JOIN report.college c on bd.college_id = c.id
        where c.id = $2
        group by id.id, id.title, id.internship_id
      ),
      assessment_data AS (
        SELECT
          ia.domain_id,
          COUNT(ia.assessment_id) AS assessment_count,
          SUM(CASE WHEN h.test_type_id = 13 THEN 1 ELSE 0 END) AS daily_tests,
          SUM(CASE WHEN h.test_type_id = 81 THEN 1 ELSE 0 END) AS grand_tests,
          SUM(CASE WHEN h.test_type_id = 80 THEN 1 ELSE 0 END) AS assignments,
          SUM(CASE WHEN h.test_type_id in (6,54,12) THEN 1 ELSE 0 END) AS mets
        FROM
          report.internship_assessment ia
        INNER JOIN
          hackathon h ON ia.assessment_id = h.id
        GROUP BY
          ia.domain_id
      ),
      live_sessions_data AS (
        SELECT
          ils.domain_id,
          COUNT(ils.event_id) AS live_session_count
        FROM
          report.internship_live_sessions ils
        GROUP BY
          ils.domain_id
      )
      SELECT
        dd.id,
        dd.title,
        COALESCE(ad.assessment_count, 0) AS assessment_count,
        COALESCE(ad.daily_tests, 0) AS daily_tests,
        COALESCE(ad.grand_tests, 0) AS grand_tests,
        COALESCE(ad.assignments, 0) AS assignments,
        COALESCE(ad.mets, 0) AS mets,
        COALESCE(lsd.live_session_count, 0) AS live_session_count
      FROM
        domain_data dd
      LEFT JOIN
        assessment_data ad ON dd.id = ad.domain_id
      LEFT JOIN
        live_sessions_data lsd ON dd.id = lsd.domain_id
      WHERE
        dd.internship_id = $1;
    `;

    const result = await pool.query(query, [internshipId,college_id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Details not found');
    }

    const tableDetails = result.rows;

    // Cache the result
    await cacheManager.setCachedData(cacheKey, tableDetails);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const refreshedData = await pool.query(query, [internshipId,college_id]);
      if (refreshedData.rows.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedData.rows);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.status(200).json(tableDetails);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/top_students/:id',isAuthenticated, async (req, res) => {
  const internshipId = req.params.id;
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  try {
    const cacheKey = `top_students_${internshipId}_${college_id}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);
  
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT
        bd.name,
        bd.email,
        bd.phone,
        bd.regno,
        c.name AS college_name,
        jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores,
        ROUND(SUM(uhp.current_score * 100.0 / COALESCE(hw.score, 1)) / COUNT(h.id), 2) AS average_score
      FROM
        report.internships i
      INNER JOIN
        report.internship_domain id ON i.id = id.internship_id
      INNER JOIN
        report.internship_assessment ia ON id.id = ia.domain_id
      INNER JOIN
        report.internship_batch ib ON id.id = ib.domain_id
      INNER JOIN
        report.batch b ON ib.batch_id = b.id
      INNER JOIN
        report.batch_data bd ON b.id = bd.batch_id
      INNER JOIN
        "user" u ON bd.email = u.email
      INNER JOIN
        college c ON u.college_id = c.id
      INNER JOIN
        user_hackathon_participation uhp ON u.id = uhp.user_id
      INNER JOIN
        hackathon h ON uhp.hackathon_id = h.id AND ia.assessment_id = h.id
      LEFT JOIN
        hackathon_with_score hw ON h.id = hw.id
      WHERE
        i.id = $1 AND c.id = $2
      GROUP BY
        bd.name, bd.email, bd.phone, bd.regno, c.name
      ORDER BY
        average_score DESC
      LIMIT
        100;
    `;

    const result = await pool1.query(query, [internshipId, college_id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Top Students not found');
    }

    const topStudents = result.rows;

    // Cache the result
    await cacheManager.setCachedData(cacheKey, topStudents);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const refreshedData = await pool1.query(query, [internshipId, college_id]);
      if (refreshedData.rows.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedData.rows);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.status(200).json(topStudents);
  } catch (error) {
    console.error('Error fetching Top Student details:', error);
    res.status(500).send('Internal Server Error');
  }
});



module.exports = router;