// File path: routes/data.js

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig_write);

router.get('/data/:id', async (req, res) => {
  try {
    const phaseId = req.params.id;

    const eventsQuery = `
      SELECT event_title
      FROM report.events e
      INNER JOIN report.phase_live_sessions pl ON e.id = pl.event_id
      WHERE pl.phase_id = $1;
    `;
    const eventsResult = await pool.query(eventsQuery, [phaseId]);

    if (!eventsResult) {
      return res.status(500).json({ error: 'An error occurred fetching events.' });
    }

    const allEvents = eventsResult.rows.map(row => row.event_title);

    const sql = `
      WITH DistinctEvents AS (
        SELECT
          bd.name,
          bd.email,
          sr.registration_number,
          bd.phone,
          c.code AS college_code,
          json_agg(DISTINCT e.event_title) AS events
        FROM
          report.student_responses sr
        INNER JOIN
          report.batch_data bd ON sr.registration_number = bd.regno
        INNER JOIN
          report.phase_batch pb ON bd.batch_id = pb.batch_id
        INNER JOIN
          report.phase p ON pb.phase_id = p.id
        INNER JOIN
          report.phase_live_sessions pls ON p.id = pls.phase_id
        INNER JOIN
          college c ON bd.college_id = c.id
        INNER JOIN
          report.events e ON pls.event_id = e.id
        WHERE p.id = $1
        GROUP BY
          sr.registration_number, c.code, bd.name, bd.email, bd.phone
      )
      SELECT
        name,
        email,
        registration_number,
        phone,
        events
      FROM
        DistinctEvents;
    `;

    const result = await pool.query(sql, [phaseId]);

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




module.exports = router;
