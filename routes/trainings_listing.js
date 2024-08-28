const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');

router.get('/trainings', isAuthenticated, async (req, res) => {
  const college_id = req.user.college;
        
  if (!college_id) {
      return res.status(400).json({ error: 'College ID not found in session.' });
  }

  try {
    const selectQuery = `
      SELECT
        rt.id,
        title,
        description,
        total_training_hours,
        trainings_type_id,
        college_id,
        c.name AS college_name,
        TO_CHAR(start_date, 'DD-MM-YYYY') as start_date,
        TO_CHAR(end_date, 'DD-MM-YYYY') as end_date,
        banner
      FROM report.trainings rt
      INNER JOIN report.college c ON CAST(rt.college_id AS INTEGER) = c.id
      WHERE c.id = $1  
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(selectQuery, [college_id]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching trainings:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

module.exports = router;
