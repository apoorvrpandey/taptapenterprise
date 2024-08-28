const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfigWrite = require('../read_replica_config');
const AWS = require('aws-sdk');
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfigWrite);

// AWS SDK configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const CACHE_TABLE = 'CacheTable';
const CACHE_EXPIRY_SECONDS = 600; // Cache expiry time in seconds (10 Minutes)

// Utility function to get cached data from DynamoDB
const getCachedData = async (key) => {
  const params = {
    TableName: CACHE_TABLE,
    Key: { cacheKey: key },
  };
  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item ? JSON.parse(result.Item.data) : null;
  } catch (error) {
    console.error(`Error getting cached data for key ${key}:`, error);
    throw error;
  }
};

// Utility function to set cached data in DynamoDB
const setCachedData = async (key, data) => {
  const params = {
    TableName: CACHE_TABLE,
    Item: {
      cacheKey: key,
      data: JSON.stringify(data),
      ttl: Math.floor(Date.now() / 1000) + CACHE_EXPIRY_SECONDS,
    },
  };
  try {
    await dynamoDb.put(params).promise();
  } catch (error) {
    console.error(`Error setting cached data for key ${key}:`, error);
    throw error;
  }
};

router.get('/domain_details/:id', async (req, res) => {
  const domainId = req.params.id;
  const collegeId = req.session.college_id;

  if (!collegeId) {
    return res.status(400).json({ error: 'College code not found in session.' });
  }

  try {
    const cacheKey = `domain_details${collegeId}_${domainId}`;
    const cachedData = await getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT title FROM report.internship_domain
      WHERE id = $1
    `;
    const result = await pool.query(query, [domainId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Domain not found');
    }

    const domain = result.rows[0];
    await setCachedData(cacheKey, domain);
    res.status(200).json(domain);
  } catch (error) {
    console.error('Error fetching domain details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/live_sessions_topdata/:id', async (req, res) => {
  const domainId = req.params.id;
  const collegeId = req.session.college_id;

  if (!collegeId) {
    return res.status(400).json({ error: 'College code not found in session.' });
  }

  try {
    const cacheKey = `live_sessions_topdata${collegeId}_${domainId}`;
    const cachedData = await getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      WITH TotalStudents AS (
        SELECT ib.domain_id, COUNT(DISTINCT bd.regno) AS total_students
        FROM report.internship_domain id
        INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
        INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
        INNER JOIN report.college c ON bd.college_id = c.id
        WHERE c.id = $2
        GROUP BY ib.domain_id
      ),
      DomainAttendance AS (
        SELECT ils.domain_id, COUNT(DISTINCT sr.registration_number) AS present_students
        FROM report.student_responses sr
        INNER JOIN report.internship_live_sessions ils ON sr.event_id = ils.event_id
        INNER JOIN report.internship_domain id ON ils.domain_id = id.id
        INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
        INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id AND sr.registration_number = bd.regno
        INNER JOIN report.college c ON bd.college_id = c.id
        WHERE c.id = $3
        GROUP BY ils.domain_id
      ),
      LiveSessionHours AS (
        SELECT id.id, SUM(e.num_hours) AS total_hours, COUNT(ils.event_id) AS number_of_live_sessions
        FROM report.internship_domain id
        INNER JOIN report.internship_live_sessions ils ON id.id = ils.domain_id
        INNER JOIN report.events e ON ils.event_id = e.id
        GROUP BY id.id
      )
      SELECT id.title, lsh.number_of_live_sessions, lsh.total_hours, ts.total_students,
      COALESCE(da.present_students, 0) AS present_students,
      ts.total_students - COALESCE(da.present_students, 0) AS absent_students,
      ROUND(COALESCE(da.present_students, 0) * 100.0 / ts.total_students) AS attendance_rate,
      ROUND(AVG(CASE sr.feedback
        WHEN 'Extremely Satisfied' THEN 5
        WHEN 'Very Satisfied' THEN 4
        WHEN 'Satisfied' THEN 3
        WHEN 'Slightly Satisfied' THEN 2
        WHEN 'Needs Improvement' THEN 1
        ELSE 0
      END), 2) AS average_feedback,
      ROUND(AVG(CASE sr.interactive
        WHEN 'Yes' THEN 1
        ELSE 0
      END) * 100, 2) AS avg_interactiveness_percentage
      FROM TotalStudents ts
      LEFT JOIN DomainAttendance da ON ts.domain_id = da.domain_id
      INNER JOIN LiveSessionHours lsh ON ts.domain_id = lsh.id
      INNER JOIN report.internship_live_sessions ils ON ts.domain_id = ils.domain_id
      INNER JOIN report.student_responses sr ON ils.event_id = sr.event_id
      INNER JOIN report.internship_domain id ON ts.domain_id = id.id
      INNER JOIN report.events e ON ils.event_id = e.id
      WHERE id.id = $1
      AND ts.total_students - COALESCE(da.present_students, 0) > 0
      GROUP BY id.title, ts.total_students, da.present_students, lsh.total_hours, lsh.number_of_live_sessions;
    `;
    const result = await pool.query(query, [domainId, collegeId, collegeId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Live sessions data not found');
    }

    const liveSessionsData = result.rows[0];
    await setCachedData(cacheKey, liveSessionsData);
    res.status(200).json(liveSessionsData);
  } catch (error) {
    console.error('Error fetching live session details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/assessment_graph_details/:id', async (req, res) => {
  const domainId = req.params.id;
  const collegeId = req.session.college_id;

  if (!collegeId) {
    return res.status(400).json({ error: 'College code not found in session.' });
  }

  try {
    const cacheKey = `assessment_graph_details${collegeId}_${domainId}`;
    const cachedData = await getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT COUNT(ia.assessment_id) AS assessment_count,
      SUM(CASE WHEN h.test_type_id = 13 THEN 1 ELSE 0 END) AS daily_tests,
      SUM(CASE WHEN h.test_type_id = 81 THEN 1 ELSE 0 END) AS grand_tests,
      SUM(CASE WHEN h.test_type_id = 80 THEN 1 ELSE 0 END) AS assignments
      FROM report.internship_domain id
      INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
      INNER JOIN hackathon h ON ia.assessment_id = h.id
      WHERE id.id = $1
    `;
    const result = await pool1.query(query, [domainId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Assessments not found');
    }

    const assessmentDetails = result.rows[0];
    await setCachedData(cacheKey, assessmentDetails);
    res.status(200).json(assessmentDetails);
  } catch (error) {
    console.error('Error fetching assessment details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/employability_graph_details/:id', async (req, res) => {
  const domainId = req.params.id;
  const collegeId = req.session.college_id;

  if (!collegeId) {
    return res.status(400).json({ error: 'College code not found in session.' });
  }

  try {
    const cacheKey = `employability_graph_details${collegeId}_${domainId}`;
    const cachedData = await getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      SELECT h.id, h.title, h.scheduled_at, h.test_type_id, rfr.efficiency, rfr.accuracy,
      rfr.analysis, rfr.correct_answers, rfr.incorrect_answers, rfr.not_answered
      FROM report.internship_domain id
      INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
      INNER JOIN hackathon h ON ia.assessment_id = h.id
      INNER JOIN report.final_result rfr ON h.id = rfr.assessment_id
      WHERE id.id = $1
    `;
    const result = await pool1.query(query, [domainId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Employability details not found');
    }

    const employabilityDetails = result.rows;
    await setCachedData(cacheKey, employabilityDetails);
    res.status(200).json(employabilityDetails);
  } catch (error) {
    console.error('Error fetching employability details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/enrolled_students/:id', async (req, res) => {
    const domainId = req.params.id;
  
    try {
      const college_id = req.session.college_id || null;
      const cacheKey = `enrolled_students${college_id}_${domainId}`;
      const cachedData = await getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
  
      const query = `
        SELECT
          u.image,
          bd.email,
          bd.name,
          ROUND(pro.total_score, 2) as emp_score,
          pro.employability_band,
          id.title,
          id.start_date
        FROM
          report.batch_data bd
        INNER JOIN
          report.internship_batch ib ON bd.batch_id = ib.batch_id
        INNER JOIN
          report.internship_domain id ON ib.domain_id = id.id
        LEFT JOIN "user" u ON bd.email = u.email
        LEFT JOIN report.profiling_report_overall pro ON u.id = pro.user_id
        INNER JOIN college c ON u.college_id = c.id
        WHERE id.id = $1 AND c.id = $2
      `;
      const result = await pool1.query(query, [domainId, college_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).send('Enrolled Students not found');
      }
  
      await setCachedData(cacheKey, result.rows); // Cache data in DynamoDB
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching enrolled student details:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.get('/daily_test/:id', async (req, res) => {
    const domainId = req.params.id;
  
    try {
      const college_id = req.session.college_id || null;
      const cacheKey = `daily_test${college_id}_${domainId}`;
      const cachedData = await getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
  
      const query = `
        SELECT
          bd.name,
          bd.email,
          bd.regno,
          ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
          jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores
        FROM
          report.internship_domain id
        INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
        INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
        INNER JOIN report.batch b ON ib.batch_id = b.id
        INNER JOIN report.batch_data bd ON b.id = bd.batch_id
        INNER JOIN "user" u ON bd.email = u.email
        INNER JOIN college c ON u.college_id = c.id
        INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
        INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND ia.assessment_id = h.id
        LEFT JOIN hackathon_with_score hw ON h.id = hw.id
        WHERE id.id = $1 AND h.test_type_id = 13 AND c.id = $2
        GROUP BY bd.name, bd.email, bd.regno
      `;
      const result = await pool1.query(query, [domainId, college_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).send('Daily Test not found');
      }
  
      await setCachedData(cacheKey, result.rows); // Cache data in DynamoDB
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching daily test details:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.get('/grand_test/:id', async (req, res) => {
    const domainId = req.params.id;
  
    try {
      const college_id = req.session.college_id || null;
      const cacheKey = `grand_test_${college_id}_${domainId}`;
      const cachedData = await getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
  
      const query = `
        SELECT
          bd.name,
          bd.email,
          bd.regno,
          ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
          jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores
        FROM
          report.internship_domain id
        INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
        INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
        INNER JOIN report.batch b ON ib.batch_id = b.id
        INNER JOIN report.batch_data bd ON b.id = bd.batch_id
        INNER JOIN "user" u ON bd.email = u.email
        INNER JOIN college c ON u.college_id = c.id
        INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
        INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND ia.assessment_id = h.id
        LEFT JOIN hackathon_with_score hw ON h.id = hw.id
        WHERE id.id = $1 AND h.test_type_id = 81 AND c.id = $2
        GROUP BY bd.name, bd.email, bd.regno
      `;
      const result = await pool1.query(query, [domainId, college_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).send('Grand Test Details not found');
      }
  
      await setCachedData(cacheKey, result.rows); // Cache data in DynamoDB
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching grand test details:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.get('/employability_students_data/:id', async (req, res) => {
    const domainId = req.params.id;
  
    try {
      const college_id = req.session.college_id || null;
      const cacheKey = `employability_students_data_${college_id}_${domainId}`;
      const cachedData = await getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
  
      const query = `
        SELECT
          bd.name,
          bd.email,
          bd.regno,
          ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
          jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores
        FROM
          report.internship_domain id
        INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
        INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
        INNER JOIN report.batch b ON ib.batch_id = b.id
        INNER JOIN report.batch_data bd ON b.id = bd.batch_id
        INNER JOIN "user" u ON bd.email = u.email
        INNER JOIN college c ON u.college_id = c.id
        INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
        INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND ia.assessment_id = h.id
        LEFT JOIN hackathon_with_score hw ON h.id = hw.id
        WHERE id.id = $1 AND h.test_type_id = 6 AND c.id = $2
        GROUP BY bd.name, bd.email, bd.regno
      `;
      const result = await pool1.query(query, [domainId, college_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).send('Employability Test not found');
      }
  
      await setCachedData(cacheKey, result.rows); // Cache data in DynamoDB
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching employability test details:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.get('/data/:id', async (req, res) => {
    try {
      const college_id = req.session.college_id || null;
      const domainId = req.params.id;
      const cacheKey = `data_${college_id}_${domainId}`;
      const cachedData = await getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
  
      const eventsQuery = `
        SELECT event_title
        FROM report.events e
        INNER JOIN report.internship_live_sessions pl ON e.id = pl.event_id
        WHERE pl.domain_id = $1;
      `;
      const eventsResult = await pool1.query(eventsQuery, [domainId]);
  
      if (!eventsResult.rows || eventsResult.rows.length === 0) {
        return res.status(500).json({ error: 'An error occurred fetching events.' });
      }
  
      const allEvents = eventsResult.rows.map(row => row.event_title);
  
      const sql = `
        WITH DistinctEvents AS (
          SELECT
              sr.registration_number,
              c.code AS college_code,
              json_agg(DISTINCT e.event_title) AS events,
              bd.name,
              bd.email,
              bd.phone
          FROM
              report.batch_data bd
          INNER JOIN
              report.student_responses sr ON bd.regno = sr.registration_number
          INNER JOIN
              report.internship_batch ib ON bd.batch_id = ib.batch_id
          INNER JOIN
              report.internship_domain id ON ib.domain_id = id.id
          INNER JOIN
              college c ON bd.college_id = c.id
          INNER JOIN
              report.events e ON sr.event_id = e.id
          INNER JOIN 
              report.internship_live_sessions ils ON ils.event_id = e.id
          WHERE
              id.id = $1 AND c.id = $2
          GROUP BY
              sr.registration_number, c.code, bd.name, bd.email, bd.phone
          HAVING
              json_agg(DISTINCT e.event_title) IS NOT NULL  -- Ensure the events array is not empty
        )
        SELECT
            registration_number,
            name,
            email,
            phone,
            events
        FROM
            DistinctEvents;
      `;
  
      const result = await pool1.query(sql, [domainId, college_id]);
  
      if (!result.rows || result.rows.length === 0) {
        return res.status(500).json({ error: 'An error occurred fetching user events.' });
      }
  
      await setCachedData(cacheKey, result.rows); // Cache data in DynamoDB
      const data = result.rows.map(row => {
        const userEvents = row.events || [];
        const rowData = {
          'Registration Number': row.registration_number,
          'Name': row.name,
          'Email': row.email,
          'Phone': row.phone,
        };
  
        allEvents.forEach(event => {
          rowData[event] = userEvents.includes(event) ? '✔' : '❌';
        });
  
        return rowData;
      });
  
      res.json(data);
    } catch (error) {
      console.error('Error querying database:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });
  
  router.get('/attendance_count/:id', async (req, res) => {
    const domainId = req.params.id;
  
    try {
      const college_id = req.session.college_id || null;
      const cacheKey = `attendance_count_${college_id}_${domainId}`;
      const cachedData = await getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
  
      const query = `
        SELECT
          e.event_title,
          count(sr.event_id)
        FROM
          report.batch_data bd
        INNER JOIN
          report.student_responses sr ON bd.regno = sr.registration_number
        INNER JOIN
          report.internship_batch ib ON bd.batch_id = ib.batch_id
        INNER JOIN
          report.internship_domain id ON ib.domain_id = id.id
        INNER JOIN
          college c ON bd.college_id = c.id
        INNER JOIN
          report.events e ON sr.event_id = e.id
        INNER JOIN report.internship_live_sessions ils ON e.id = ils.event_id
        WHERE id.id = $1 AND c.id = $2
        GROUP BY e.event_title
      `;
      const result = await pool1.query(query, [domainId, college_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).send({ message: 'Attendance Data not found' });
      }
  
      await setCachedData(cacheKey, result.rows); // Cache data in DynamoDB
      const attendanceData = result.rows.map((row) => ({
        event_title: row.event_title,
        count: row.count,
      }));
  
      res.json(attendanceData);
    } catch (error) {
      console.error('Error fetching Attendance Data:', error);
      res.status(500).send({ message: 'Internal Server Error' });
    }
  });
  
  module.exports = router;