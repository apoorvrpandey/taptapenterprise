const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);
const xlsx = require('node-xlsx').default;
const isAuthenticated = require('../jwtAuth.js');

const SQL_QUERY = `
WITH unique_student_responses AS (
    SELECT DISTINCT ON (event_id, registration_number)
        event_id,
        registration_number
    FROM
        report.student_responses
    ORDER BY
        event_id,
        registration_number,
        created_at -- Assuming 'response_time' column to get the latest response.
),
internship_weeks AS (
    SELECT
        i.id AS internship_id,
        bd.name,
        bd.email,
        bd.phone,
        bd.regno,
        i.start_date AS internship_start,
        i.end_date AS internship_end,
        e.start_date AS event_start,
        e.id AS event_id,
        CASE
            WHEN usr.registration_number IS NOT NULL THEN 1
            ELSE 0
        END AS attended,
        EXTRACT(WEEK FROM e.start_date) - EXTRACT(WEEK FROM i.start_date) + 1 AS week_number,
        DATE_TRUNC('week', e.start_date) AS week_start,
        DATE_TRUNC('week', e.start_date) + INTERVAL '6 days' AS week_end
    FROM
        report.internships i
        INNER JOIN report.internship_domain id ON i.id = id.internship_id
        INNER JOIN report.internship_live_sessions ils ON id.id = ils.domain_id
        INNER JOIN report.events e ON ils.event_id = e.id
        INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
        INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
        LEFT JOIN unique_student_responses usr ON e.id = usr.event_id AND bd.regno = usr.registration_number
    WHERE
        id.id = 26
        AND e.start_date BETWEEN i.start_date AND i.end_date
),
weekly_attendance AS (
    SELECT
        internship_id,
        regno,
        week_start,
        week_end,
        COUNT(event_id) AS total_events,
        SUM(attended) AS attended_events,
        CASE
            WHEN COUNT(event_id) = 0 THEN 0
            ELSE (SUM(attended) * 100.0 / COUNT(event_id))
        END AS attendance_percentage
    FROM
        internship_weeks
    GROUP BY
        internship_id, regno, week_start, week_end
),
json_agg_weeks AS (
    SELECT
        regno,
        json_agg(json_build_object(
            'week_start', week_start,
            'week_end', week_end,
            'total_events', total_events,
            'attended_events', attended_events,
            'attendance_percentage', attendance_percentage
        ) ORDER BY week_start) AS weekly_data
    FROM
        weekly_attendance
    GROUP BY
        regno
)
SELECT
    bd.name,
    bd.email,
    bd.phone,
    bd.regno,
    ja.weekly_data
FROM
    report.batch_data bd
    INNER JOIN json_agg_weeks ja ON bd.regno = ja.regno
ORDER BY
    bd.name;
`;

// Define a route to fetch internship attendance data
router.get('/data', async (req, res) => {
  try {
    const client = await pool1.connect();
    try {
      const { rows } = await client.query(SQL_QUERY);
      res.json(rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
