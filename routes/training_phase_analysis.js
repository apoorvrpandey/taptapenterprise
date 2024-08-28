const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const xlsx = require('node-xlsx').default;
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);
const isAuthenticated = require('../jwtAuth.js');

router.get('/phase_details/:id', async (req, res) => {
  const phaseId = req.params.id;
  try {
    const query = `
    select title from report.phase
      WHERE 
        id = $1
    `;
    const result = await pool.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).send('phase not found');
    }

    const phase = result.rows[0];
    res.status(200).json(phase);
  } catch (error) {
    console.error('Error fetching phase details:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/live_sessions_topdata/:id', async(req,res) =>{
  const phaseId = req.params.id;
  try {
    const query = `
    WITH TotalStudents AS (
    SELECT
        pb.phase_id,
        COUNT(DISTINCT bd.regno) AS total_students
    FROM
        report.phase p
        INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
        INNER JOIN report.batch_data bd ON pb.batch_id = bd.batch_id
    GROUP BY
        pb.phase_id
),
PhaseAttendance AS (
    SELECT
        pls.phase_id,
        COUNT(DISTINCT sr.registration_number) AS present_students
    FROM
        report.student_responses sr
        INNER JOIN report.phase_live_sessions pls ON sr.event_id = pls.event_id
        INNER JOIN report.phase p ON pls.phase_id = p.id
    GROUP BY
        pls.phase_id
),
LiveSessionHours AS (
    SELECT
        phase.id,
        SUM(e.num_hours) AS total_hours,
        COUNT(ls.event_id) AS number_of_live_sessions
    FROM
        report.phase
        INNER JOIN report.phase_live_sessions ls ON phase.id = ls.phase_id
        INNER JOIN report.events e ON ls.event_id = e.id
    GROUP BY
        phase.id
)
SELECT
    p.title,
    lsh.number_of_live_sessions,
    lsh.total_hours,
    ts.total_students,
    COALESCE(pa.present_students, 0) AS present_students,
    ts.total_students - COALESCE(pa.present_students, 0) AS absent_students,
    ROUND(COALESCE(pa.present_students, 0) * 100.0 / ts.total_students) AS attendance_rate,
    ROUND(AVG(
        CASE sr.feedback
            WHEN 'Extremely Satisfied' THEN 5
            WHEN 'Very Satisfied' THEN 4
            WHEN 'Satisfied' THEN 3
            WHEN 'Slightly Satisfied' THEN 2
            WHEN 'Needs Improvement' THEN 1
            ELSE 0 -- Assuming no feedback or invalid feedback is treated as 0, adjust as needed
        END) * 1, 2 
    )AS average_feedback,
    ROUND(
        AVG(
            CASE sr.interactive
                WHEN 'Yes' THEN 1
                ELSE 0
            END
        ) * 100, 2
    ) AS avg_interactiveness_percentage
FROM
    TotalStudents ts
    LEFT JOIN PhaseAttendance pa ON ts.phase_id = pa.phase_id
    INNER JOIN LiveSessionHours lsh ON ts.phase_id = lsh.id
    INNER JOIN report.phase_live_sessions pls ON ts.phase_id = pls.phase_id
    INNER JOIN report.student_responses sr ON pls.event_id = sr.event_id
    INNER JOIN report.phase p ON ts.phase_id = p.id
    INNER JOIN report.events e ON pls.event_id = e.id
WHERE
    p.id = $1
    AND ts.total_students - COALESCE(pa.present_students, 0) > 0 -- Filter to get students who are absent for all events
GROUP BY
    p.title, ts.total_students, pa.present_students, lsh.total_hours, lsh.number_of_live_sessions;
    `;
    const result = await pool.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).send('phase not found');
    }

    const phase = result.rows[0];
    res.status(200).json(phase);
  } catch (error) {
    console.error('Error fetching phase details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/assessment_graph_details/:id', async(req,res) =>{
  const phaseId = req.params.id;
  try {
    const query = `
   select COUNT(pa.assessment_id) AS assessment_count,
        SUM(CASE WHEN h.test_type_id = 13 THEN 1 ELSE 0 END) AS daily_tests,
        SUM(CASE WHEN h.test_type_id = 81 THEN 1 ELSE 0 END) AS grand_tests,
        SUM(CASE WHEN h.test_type_id = 80 THEN 1 ELSE 0 END) AS assignments from report.phase p
INNER JOIN report.phase_assessment pa on p.id = pa.phase_id
INNER JOIN hackathon h on pa.assessment_id = h.id
where p.id = $1
    `;
    const result = await pool.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Assessments not found');
    }

    const phase = result.rows[0];
    res.status(200).json(phase);
  } catch (error) {
    console.error('Error fetching Assessments details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/employability_graph_details/:id', async (req, res) => {
  const phaseId = req.params.id;

  try {
    const query = `
      SELECT
          h.title,
          ROUND(AVG(uhp.current_score * 100 / hw.score),2) AS average_100_equivalent_score,
          count(user_id) as students_attempted
      FROM
          user_hackathon_participation uhp
      INNER JOIN
          hackathon h ON uhp.hackathon_id = h.id
      INNER JOIN
          "user" u ON uhp.user_id = u.id
      INNER JOIN
          report.batch_data bd on u.email = bd.email
      INNER JOIN
          report.phase_batch pb on bd.batch_id = pb.batch_id
      INNER JOIN
          report.phase p on pb.phase_id = p.id
      INNER JOIN
          report.phase_assessment pa on h.id = pa.assessment_id
      INNER JOIN
          report.trainings t on p.training_id = t.id
      INNER JOIN
          college c ON u.college_id = c.id
      INNER JOIN
          hackathon_with_score hw ON h.id = hw.id
      WHERE
          p.id = $1
          AND h.test_type_id = 6
      GROUP BY
          h.title;
    `;
    
    const result = await pool1.query(query, [phaseId]);
  

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    res.json(result.rows); // Ensure the entire array is sent in the response
  } catch (error) {
   
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.get('/enrolled_students/:id', async(req,res) => {
  const phaseId = req.params.id;
  try {
    const query = `
    SELECT
    u.image,
    bd.email,
        bd.name,
        ROUND(pro.total_score, 2) as emp_score,
        pro.employability_band,
        p.title,
        p.start_date
    FROM
        report.batch_data bd
    INNER JOIN
        report.phase_batch pb ON bd.batch_id = pb.batch_id
    INNER JOIN
        report.phase p ON pb.phase_id = p.id
    LEFT JOIN "user" u on  bd.email = u.email
    LEFT JOIN report.profiling_report_overall pro on u.id = pro.user_id
where p.id = $1
    `;
    const result = await pool1.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Enrolled Students not found');
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enrolled student details:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/daily_test/:id' , async(req,res) =>{
  const phaseId = req.params.id;
  try {
    const query = `
    SELECT
  bd.name,
  bd.email,
  bd.regno,
   ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
  jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores

FROM
  report.phase p
  INNER JOIN report.phase_assessment pa ON p.id = pa.phase_id
  INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
  INNER JOIN report.batch b ON pb.batch_id = b.id
  INNER JOIN report.batch_data bd ON b.id = bd.batch_id
  INNER JOIN "user" u ON bd.email = u.email
  INNER JOIN college c ON u.college_id = c.id
  INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
  INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND pa.assessment_id = h.id
  LEFT JOIN hackathon_with_score hw ON h.id = hw.id
WHERE
  p.id = $1
  AND h.test_type_id = 13
GROUP BY
  bd.name,
  bd.email,
  bd.regno;
    `;
    const result = await pool1.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'The test has not been conducted yet, so there are no results to show. Please stay tuned for updates.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily test details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/grand_test/:id' , async(req,res) =>{
  const phaseId = req.params.id;
  try {
    const query = `
    SELECT
  bd.name,
  bd.email,
  bd.regno,
   ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
  jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores

FROM
  report.phase p
  INNER JOIN report.phase_assessment pa ON p.id = pa.phase_id
  INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
  INNER JOIN report.batch b ON pb.batch_id = b.id
  INNER JOIN report.batch_data bd ON b.id = bd.batch_id
  INNER JOIN "user" u ON bd.email = u.email
  INNER JOIN college c ON u.college_id = c.id
  INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
  INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND pa.assessment_id = h.id
  LEFT JOIN hackathon_with_score hw ON h.id = hw.id
WHERE
  p.id = $1
  AND h.test_type_id = 81
GROUP BY
  bd.name,
  bd.email,
  bd.regno;
    `;
    const result = await pool1.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'The test has not been conducted yet, so there are no results to show. Please stay tuned for updates.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching grand test details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/weekly_test/:id' , async(req,res) =>{
  const phaseId = req.params.id;
  try {
    const query = `
    SELECT
  bd.name,
  bd.email,
  bd.regno,
   ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
  jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores

FROM
  report.phase p
  INNER JOIN report.phase_assessment pa ON p.id = pa.phase_id
  INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
  INNER JOIN report.batch b ON pb.batch_id = b.id
  INNER JOIN report.batch_data bd ON b.id = bd.batch_id
  INNER JOIN "user" u ON bd.email = u.email
  INNER JOIN college c ON u.college_id = c.id
  INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
  INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND pa.assessment_id = h.id
  LEFT JOIN hackathon_with_score hw ON h.id = hw.id
WHERE
  p.id = $1
  AND h.test_type_id = 43
GROUP BY
  bd.name,
  bd.email,
  bd.regno;
    `;
    const result = await pool1.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'The test has not been conducted yet, so there are no results to show. Please stay tuned for updates.' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching weekly test details:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/employability_students_data/:id' ,  async(req,res) =>{
  const phaseId = req.params.id;
  try {
    const query = `
    SELECT
  bd.name,
  bd.email,
  bd.regno,
   ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
  jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores

FROM
  report.phase p
  INNER JOIN report.phase_assessment pa ON p.id = pa.phase_id
  INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
  INNER JOIN report.batch b ON pb.batch_id = b.id
  INNER JOIN report.batch_data bd ON b.id = bd.batch_id
  INNER JOIN "user" u ON bd.email = u.email
  INNER JOIN college c ON u.college_id = c.id
  INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
  INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND pa.assessment_id = h.id
  LEFT JOIN hackathon_with_score hw ON h.id = hw.id
WHERE
  p.id = $1
  AND h.test_type_id = 6
GROUP BY
  bd.name,
  bd.email,
  bd.regno;
    `;
    const result = await pool1.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'The test has not been taken by students yet, so there are no results to show. Please stay tuned for updates.' });
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily test details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/data/:id', async (req, res) => {
  try {
    const phaseId = req.params.id;

    const eventsQuery = `
      SELECT event_title
      FROM report.events e
      INNER JOIN report.phase_live_sessions pl ON e.id = pl.event_id
      WHERE pl.phase_id = $1;
    `;
    const eventsResult = await pool1.query(eventsQuery, [phaseId]);

    if (!eventsResult) {
      return res.status(500).json({ error: 'An error occurred fetching events.' });
    }

    const allEvents = eventsResult.rows.map(row => row.event_title);

    const sql = `
    WITH DistinctEvents AS (
      SELECT
          sr.registration_number,
          c.code AS college_code,
          json_agg(DISTINCT e.event_title) AS events
      FROM
          report.batch_data bd
      INNER JOIN
          report.student_responses sr ON bd.regno = sr.registration_number
      INNER JOIN
          report.phase_batch pb ON bd.batch_id = pb.batch_id
      INNER JOIN
          report.phase p ON pb.phase_id = p.id
      INNER JOIN
          college c ON bd.college_id = c.id
      INNER JOIN
          report.events e ON sr.event_id = e.id
      INNER JOIN report.phase_live_sessions pls on pls.event_id = e.id
      WHERE
          p.id = $1
      GROUP BY
          sr.registration_number, c.code
      HAVING
          json_agg(DISTINCT e.event_title) IS NOT NULL  -- Ensure the events array is not empty
  )
  SELECT
      registration_number,
      events
  FROM
      DistinctEvents;
    `;

    const result = await pool1.query(sql, [phaseId]);

    if (!result) {
      return res.status(500).json({ error: 'An error occurred fetching user events.' });
    }

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
  const phaseId = req.params.id;
  try {
    const query = `
      SELECT
        e.event_title,
        count(sr.event_id)
      FROM
        report.batch_data bd
      INNER JOIN
        report.student_responses sr ON bd.regno = sr.registration_number
      INNER JOIN
        report.phase_batch pb ON bd.batch_id = pb.batch_id
      INNER JOIN
        report.phase p ON pb.phase_id = p.id
      INNER JOIN
        college c ON bd.college_id = c.id
      INNER JOIN
        report.events e ON sr.event_id = e.id
      INNER JOIN report.phase_live_sessions pls on pls.event_id = e.id
      WHERE
        p.id = $1
      GROUP BY
        e.event_title
    `;
    const result = await pool1.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).send({ message: 'Attendance Data not found' });
    }

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

router.get('/session_inactive_students/:id',  async(req,res) =>{
  const phaseId = req.params.id;
  try {
    const query = `
     SELECT
    bd.name,
    bd.regno,
    bd.email,
    COUNT(sr.registration_number) AS response_count
FROM
    report.trainings t
    INNER JOIN report.phase p ON t.id = p.training_id
    INNER JOIN report.phase_live_sessions ls ON p.id = ls.phase_id
    INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
    INNER JOIN report.batch_data bd ON pb.batch_id = bd.batch_id
    LEFT JOIN report.student_responses sr ON bd.regno = sr.registration_number
                                          AND ls.event_id = sr.event_id
WHERE
    p.id = $1
GROUP BY
    bd.name,
    bd.regno,
    bd.email
having COUNT(sr.registration_number) = 0;
    `;
    const result = await pool1.query(query, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Inactive students not found');
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily test details:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/overview/:phaseId', async (req, res) => {
  const phaseId = req.params.phaseId;
  try {
      const overviewQuery = `
          WITH TotalStudents AS (
          SELECT
              pa.assessment_id,
              COUNT(DISTINCT bd.regno) AS total_students
          FROM
              report.phase p
              INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
              INNER JOIN report.batch_data bd ON pb.batch_id = bd.batch_id
              INNER JOIN report.phase_assessment pa ON p.id = pa.phase_id
          GROUP BY
              pa.assessment_id
          ),
          AssessmentAttendance AS (
          SELECT
              pa.assessment_id,
              COUNT(DISTINCT uhp.user_id) AS present_students,
              ROUND(AVG(uhp.current_score * 100.0 / hw.score),2) AS average_100_equivalent_score
          FROM
              user_hackathon_participation uhp
              INNER JOIN report.phase_assessment pa ON uhp.hackathon_id = pa.assessment_id
              INNER JOIN report.phase p ON pa.phase_id = p.id
              INNER JOIN "user" u ON uhp.user_id = u.id
              INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
              INNER JOIN report.batch_data bd ON u.email = bd.email AND pb.batch_id = bd.batch_id
              INNER JOIN hackathon_with_score hw ON uhp.hackathon_id = hw.id
          GROUP BY
              pa.assessment_id
          )
          SELECT
          h.id,
          h.title,
          ts.total_students,
          COALESCE(aa.present_students, 0) AS present_students,
          ts.total_students - COALESCE(aa.present_students, 0) AS absent_students,
          ROUND(COALESCE(aa.present_students, 0) * 100.0 / ts.total_students, 2) AS attendance_rate,
          aa.average_100_equivalent_score
          FROM
          TotalStudents ts
          LEFT JOIN AssessmentAttendance aa ON ts.assessment_id = aa.assessment_id
          INNER JOIN hackathon h ON ts.assessment_id = h.id
          INNER JOIN report.phase_assessment pa on h.id = pa.assessment_id
          where pa.phase_id = $1 `;

      const { rows } = await pool1.query(overviewQuery, [phaseId]);
      res.status(200).json(rows);
  } catch (error) {
      console.error('Error fetching trainings:', error.message);
      res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

router.get('/download-absentees/:eventId', async (req, res) => {
  const eventId = req.params.eventId;

  const absenteesQuery = `
      WITH TotalStudents AS (
          SELECT
              pa.assessment_id,
              bd.regno,
              bd.name,
              bd.phone,
              bd.email
          FROM
              report.phase p
              INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
              INNER JOIN report.batch_data bd ON pb.batch_id = bd.batch_id
              INNER JOIN report.phase_assessment pa ON p.id = pa.phase_id
          ),
          AssessmentsAttendance AS (
          SELECT
              uhp.hackathon_id,
              bd.email
          FROM
              user_hackathon_participation uhp
              INNER JOIN report.phase_assessment pa ON uhp.hackathon_id = pa.assessment_id
              INNER JOIN "user" u ON uhp.user_id = u.id
              INNER JOIN report.phase p ON pa.phase_id = p.id
              INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
              INNER JOIN report.batch_data bd ON u.email = bd.email
          ),
          AbsentStudents AS (
          SELECT
              ts.email,
              ts.assessment_id,
              ts.regno,
              ts.name,
              ts.phone
          FROM
              TotalStudents ts
              LEFT JOIN AssessmentsAttendance aa ON ts.assessment_id = aa.hackathon_id AND ts.email = aa.email
          WHERE
              aa.email IS NULL
          )
          SELECT
          asb.name,
          asb.phone,
          asb.email,
          asb.regno
          FROM
          AbsentStudents asb
          WHERE
          asb.assessment_id = $1
          ORDER BY
          asb.name;`;

  try {
      const result = await pool1.query(absenteesQuery, [eventId]);
      
      const data = [
          ['Name', 'Phone', 'Email', 'Absent Student ID'],
          ...result.rows.map(row => [row.name, row.phone, row.email, row.absent_student_id])
      ];
      
      const buffer = xlsx.build([{ name: 'Absentees', data }]);
      
      res.setHeader(
          'Content-Disposition',
          `attachment; filename="absentees_event_${eventId}.xlsx"`
      );
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/report/:phaseId', async (req, res) => {
  const phaseId = req.params.phaseId;
  try {
      const overviewQuery = `
          WITH TotalStudents AS (
              SELECT
                  pls.event_id,
                  COUNT(DISTINCT bd.regno) AS total_students
              FROM
                  report.phase p
                  INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
                  INNER JOIN report.batch_data bd ON pb.batch_id = bd.batch_id
                  INNER JOIN report.phase_live_sessions pls ON p.id = pls.phase_id
              GROUP BY
                  pls.event_id
          ),
          EventAttendance AS (
              SELECT
                  pls.event_id,
                  COUNT(DISTINCT sr.registration_number) AS present_students
              FROM
                  report.student_responses sr
                  INNER JOIN report.phase_live_sessions pls ON sr.event_id = pls.event_id
              GROUP BY
                  pls.event_id
          ),
          EventFeedback AS (
              SELECT
                  sr.event_id,
                  AVG(
                      CASE sr.feedback
                          WHEN 'Extremely Satisfied' THEN 5
                          WHEN 'Very Satisfied' THEN 4
                          WHEN 'Satisfied' THEN 3
                          WHEN 'Slightly Satisfied' THEN 2
                          WHEN 'Needs Improvement' THEN 1
                          ELSE 0
                      END
                  ) AS average_feedback,
                  ROUND(
                      AVG(
                          CASE sr.interactive
                              WHEN 'Yes' THEN 1
                              ELSE 0
                          END
                      ) * 100, 2
                  ) AS avg_interactiveness_percentage
              FROM
                  report.student_responses sr
              GROUP BY
                  sr.event_id
          )
          SELECT
              e.id,
              e.event_title,
              ts.total_students,
              COALESCE(ea.present_students, 0) AS present_students,
              ts.total_students - COALESCE(ea.present_students, 0) AS absent_students,
              e.num_hours AS hours_covered,
              ROUND(COALESCE(ea.present_students, 0) * 100.0 / ts.total_students) AS attendance_rate,
              ef.average_feedback,
              ef.avg_interactiveness_percentage
          FROM
              TotalStudents ts
              LEFT JOIN EventAttendance ea ON ts.event_id = ea.event_id
              INNER JOIN report.events e ON ts.event_id = e.id
              LEFT JOIN EventFeedback ef ON ts.event_id = ef.event_id
          WHERE
              ts.event_id IN (
                  SELECT event_id
                  FROM report.phase_live_sessions
                  WHERE phase_id = $1
              );
      `;

      const { rows } = await pool1.query(overviewQuery, [phaseId]);
      res.status(200).json(rows);
  } catch (error) {
      console.error('Error fetching internships:', error.message);
      res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

router.get('/download-event-absentees/:eventId', async (req, res) => {
  const eventId = req.params.eventId;

  const absenteesQuery = `
      WITH TotalStudents AS (
          SELECT
              pls.event_id,
              bd.regno AS student_id,
              bd.name,
              bd.phone,
              bd.email
          FROM
              report.phase p
              INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
              INNER JOIN report.batch_data bd ON pb.batch_id = bd.batch_id
              INNER JOIN report.phase_live_sessions pls ON p.id = pls.phase_id
      ),
      EventAttendance AS (
          SELECT
              sr.event_id,
              sr.registration_number AS student_id
          FROM
              report.student_responses sr
              INNER JOIN report.phase_live_sessions pls ON sr.event_id = pls.event_id
      ),
      AbsentStudents AS (
          SELECT
              ts.event_id,
              ts.student_id,
              ts.name,
              ts.phone,
              ts.email
          FROM
              TotalStudents ts
              LEFT JOIN EventAttendance ea ON ts.event_id = ea.event_id AND ts.student_id = ea.student_id
          WHERE
              ea.student_id IS NULL
      )
      SELECT
          asb.name,
          asb.phone,
          asb.email,
          asb.student_id AS absent_student_id
      FROM
          AbsentStudents asb
      WHERE
          asb.event_id = $1
      ORDER BY
          asb.name;
  `;

  try {
      const result = await pool1.query(absenteesQuery, [eventId]);
      
      const data = [
          ['Name', 'Phone', 'Email', 'Absent Student ID'],
          ...result.rows.map(row => [row.name, row.phone, row.email, row.absent_student_id])
      ];
      
      const buffer = xlsx.build([{ name: 'Absentees', data }]);
      
      res.setHeader(
          'Content-Disposition',
          `attachment; filename="absentees_event_${eventId}.xlsx"`
      );
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});


module.exports = router;