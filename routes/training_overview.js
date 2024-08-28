const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);
const isAuthenticated = require('../jwtAuth.js');

router.get('/training/:id', async (req, res) => {
    const trainingId = req.params.id;
  
    try {
      const selectQuery = `
      SELECT
      title,
      description,
      total_training_hours,
      trainings_type_id,
      college_id,
      c.name AS college_name,
      start_date,
      end_date,
      banner
      FROM report.trainings rt
      INNER JOIN report.college c ON CAST(rt.college_id AS INTEGER) = c.id  
        WHERE rt.id = $1
      `;
      const result = await pool.query(selectQuery, [trainingId]);
      
      if (result.rows.length === 0) {
        return res.status(404).send('Training not found');
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error retrieving training:', error.message);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  });


// API endpoint to get training details  ID
router.get('/training_details/:id', async (req, res) => {
  const trainingId = req.params.id;

  try {
    const query = `
      SELECT 
        id,
        title,
        description,
        total_training_hours,
        trainings_type_id,
        college_id,
        start_date,
        end_date,
        banner
      FROM 
        report.trainings
      WHERE 
        id = $1
    `;

    const result = await pool.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Training not found');
    }

    const training = result.rows[0];
    res.status(200).json(training);
  } catch (error) {
    console.error('Error fetching training details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint to get batch count for a given training ID
router.get('/batch_count/:id', async (req, res) => {
  const trainingId = req.params.id;

  try {
    const query = `
      SELECT COUNT(*) as count
      FROM report.batch_data bd
        INNER JOIN report.phase_batch pb on bd.batch_id = pb.batch_id
        INNER JOIN report.phase p on pb.phase_id = p.id
        INNER JOIN report.trainings t on p.training_id = t.id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Training not found');
    }

    const batchCount = result.rows[0].count;
    res.status(200).json({ batchCount });
  } catch (error) {
    console.error('Error fetching batch count:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint to get batch details for a given training ID
router.get('/batch_details/:id', async (req, res) => {
  const trainingId = req.params.id;

  try {
    const query = `
      SELECT COUNT(*) as count, b.batch_title as batch
      FROM report.batch_data bd
        INNER JOIN report.batch b on bd.batch_id = b.id
        INNER JOIN report.phase_batch pb on bd.batch_id = pb.batch_id
        INNER JOIN report.phase p on pb.phase_id = p.id
        INNER JOIN report.trainings t on p.training_id = t.id
      WHERE t.id = $1
      GROUP BY b.batch_title
    `;

    const result = await pool.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Batch Details not found');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/cards_details/:id', async (req,res) =>{
  const trainingId = req.params.id;

  try {
    const query = `
      SELECT
    ROUND(
        AVG(
            CASE feedback
                WHEN 'Extremely Satisfied' THEN 5
                WHEN 'Very Satisfied' THEN 4
                WHEN 'Satisfied' THEN 3
                WHEN 'Slightly Satisfied' THEN 2
                WHEN 'Needs Improvement' THEN 1
                ELSE 0 -- Assuming no feedback or invalid feedback is treated as 0, adjust as needed
            END
        ), 2
    ) AS average_feedback,
    ROUND(
        AVG(
            CASE interactive
                WHEN 'Yes' THEN 1
                ELSE 0
            END
        ) * 100, 2
    ) AS avg_interactiveness_percentage
FROM
    report.student_responses sr
INNER JOIN report.phase_live_sessions pls ON sr.event_id = pls.event_id
INNER JOIN report.phase ON pls.phase_id = phase.id
INNER JOIN report.trainings t on phase.training_id = t.id
WHERE
    t.id = $1;
    `;

    const result = await pool.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Details not found');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/project_and_cs/:id', async (req,res)=>{
  const trainingId = req.params.id;

  try {
    const query = `
      SELECT
    COUNT(pa.assessment_id)
FROM
    report.phase_assessment pa
INNER JOIN
    hackathon h ON pa.assessment_id = h.id
INNER JOIN
    report.phase p ON pa.phase_id = p.id
INNER JOIN
    report.trainings t ON p.training_id = t.id
WHERE
    h.test_type_id IN (39, 80)
    AND t.id = $1;
    `;

    const result = await pool.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Details not found');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/batch_students_data/:id', async (req, res) => {
  const trainingId = req.params.id;

  try {
    const query = `
    WITH batch_ids AS (
      SELECT
          b.id AS batch_id,
          COUNT(*) AS count,
          b.batch_title AS batch
      FROM
          report.batch_data bd
      INNER JOIN
          report.batch b ON bd.batch_id = b.id
      INNER JOIN
          report.phase_batch pb ON bd.batch_id = pb.batch_id
      INNER JOIN
          report.phase p ON pb.phase_id = p.id
      INNER JOIN
          report.trainings t ON p.training_id = t.id
      WHERE
          t.id = $1
      GROUP BY
          b.id, b.batch_title
  )
  SELECT batch_id,name, email,regno,phone
  FROM report.batch_data
  WHERE batch_id IN (SELECT batch_id FROM batch_ids);
  
    `;

    const result = await pool.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Student Details not found');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching Student details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/graph_details/:id', async (req,res) => {
  const trainingId = req.params.id;

  try {
    const query = `
    WITH PhaseSummary AS (
      SELECT
          trainings.id AS training_id,
          SUM(phase.live_sessions + phase.student_reviews + phase.mock_interviews) AS total_live_sessions
      FROM
          report.phase
      INNER JOIN
          report.trainings ON phase.training_id = trainings.id
      GROUP BY
          trainings.id
  ),
  EventCount AS (
      SELECT
          trainings.id AS training_id,
          COUNT(phase_live_sessions.event_id) AS total_event_count
      FROM
          report.phase_live_sessions
      INNER JOIN
          report.phase ON phase_live_sessions.phase_id = phase.id
      INNER JOIN
          report.trainings ON phase.training_id = trainings.id
      GROUP BY
          trainings.id
  ),
  PhaseAssessments AS (
      SELECT
          training_id,
          SUM(assessments) AS total_assessments
      FROM
          report.phase
      GROUP BY
          training_id
  ),
  AssessmentDetails AS (
      SELECT
          trainings.id AS training_id,
          COUNT(report.phase_assessment.assessment_id) AS assessment_count,
          COUNT(CASE WHEN hackathon.test_type_id = 13 THEN 1 END) AS daily_tests,
          COUNT(CASE WHEN hackathon.test_type_id = 81 THEN 1 END) AS grand_tests,
          COUNT(CASE WHEN hackathon.test_type_id = 80 THEN 1 END) AS assignments
      FROM
          report.phase_assessment
      INNER JOIN
          report.phase ON report.phase_assessment.phase_id = report.phase.id
      INNER JOIN
          hackathon ON report.phase_assessment.assessment_id = hackathon.id
      INNER JOIN
          test_type ON hackathon.test_type_id = test_type.id
      INNER JOIN
          report.trainings ON report.phase.training_id = report.trainings.id
      GROUP BY
          trainings.id
  )
  SELECT
      ps.total_live_sessions,
      ec.total_event_count,
      pa.total_assessments,
      ad.assessment_count,
      ad.daily_tests,
      ad.grand_tests,
      ad.assignments
  FROM
      PhaseSummary ps
  INNER JOIN
      EventCount ec ON ps.training_id = ec.training_id
  INNER JOIN
      PhaseAssessments pa ON ps.training_id = pa.training_id
  INNER JOIN
      AssessmentDetails ad ON ps.training_id = ad.training_id
  WHERE
      ps.training_id = $1;
    `;

    const result = await pool1.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Data not found');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/table_details/:id', async(req,res) =>{
  const trainingId = req.params.id;

  try {
    const query = `
    WITH phase_data AS (
      SELECT
          p.id,
          p.title,
          p.training_id
      FROM
          report.phase p
  ),
  assessment_data AS (
      SELECT
          pa.phase_id,
          COUNT(pa.assessment_id) AS assessment_count,
          SUM(CASE WHEN h.test_type_id = 13 THEN 1 ELSE 0 END) AS daily_tests,
          SUM(CASE WHEN h.test_type_id = 81 THEN 1 ELSE 0 END) AS grand_tests,
          SUM(CASE WHEN h.test_type_id = 80 THEN 1 ELSE 0 END) AS assignments
      FROM
          report.phase_assessment pa
      INNER JOIN
          hackathon h
      ON
          pa.assessment_id = h.id
      GROUP BY
          pa.phase_id
  ),
  live_sessions_data AS (
      SELECT
          pls.phase_id,
          COUNT(pls.event_id) AS live_session_count
      FROM
          report.phase_live_sessions pls
      GROUP BY
          pls.phase_id
  )
  SELECT
      pd.id,
      pd.title,
      COALESCE(ad.assessment_count, 0) AS assessment_count,
      COALESCE(ad.daily_tests, 0) AS daily_tests,
      COALESCE(ad.grand_tests, 0) AS grand_tests,
      COALESCE(ad.assignments, 0) AS assignments,
      COALESCE(lsd.live_session_count, 0) AS live_session_count
  FROM
      phase_data pd
  LEFT JOIN
      assessment_data ad
  ON
      pd.id = ad.phase_id
  LEFT JOIN
      live_sessions_data lsd
  ON
      pd.id = lsd.phase_id
  where pd.training_id = $1;
    `;

    const result = await pool1.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Details not found');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/top_students/:id', async(req,res) =>{
  const trainingId = req.params.id;

  try {
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
    report.trainings t
INNER JOIN
    report.phase p ON t.id = p.training_id
INNER JOIN
    report.phase_assessment pa ON p.id = pa.phase_id
INNER JOIN
    report.phase_batch pb ON p.id = pb.phase_id
INNER JOIN
    report.batch b ON pb.batch_id = b.id
INNER JOIN
    report.batch_data bd ON b.id = bd.batch_id
INNER JOIN
    "user" u ON bd.email = u.email
INNER JOIN
    college c ON u.college_id = c.id
INNER JOIN
    user_hackathon_participation uhp ON u.id = uhp.user_id
INNER JOIN
    hackathon h ON uhp.hackathon_id = h.id AND pa.assessment_id = h.id
LEFT JOIN
    hackathon_with_score hw ON h.id = hw.id
WHERE
    t.id = $1 
GROUP BY
    bd.name, bd.email, bd.phone, bd.regno, c.name
ORDER BY average_score DESC
LIMIT
    100;
    `;

    const result = await pool1.query(query, [trainingId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Top Students not found');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching Top Student details:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
