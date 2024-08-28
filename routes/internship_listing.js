const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig);

// AWS SDK configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


router.get('/internships', isAuthenticated, async (req, res) => {
  const college_id = req.user.college;
  
  if (!college_id) {
    return res.status(400).json({ error: 'College code not found in session.' });
  }

  try {

    // If cached data doesn't exist, fetch from PostgreSQL
    const selectQuery = `
      SELECT
        rt.id,
        rt.title,
        rt.description,
        rt.total_hours,
        rt.internship_type_id,
        TO_CHAR(rt.start_date, 'DD-MM-YYYY') AS start_date,
        TO_CHAR(rt.end_date, 'DD-MM-YYYY') AS end_date,
        rt.banner,
        COUNT(bd.batch_id) AS batch_count,
        rt.created_at
      FROM 
        report.internships rt
        INNER JOIN report.internship_domain id ON rt.id = id.internship_id
        INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
        INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
      WHERE 
        bd.college_id = $1
      GROUP BY 
        rt.id, rt.title, rt.description, rt.total_hours, rt.internship_type_id, 
        rt.start_date, rt.end_date, rt.banner, rt.created_at
      HAVING 
        COUNT(bd.batch_id) > 0
      ORDER BY 
        rt.created_at DESC;
    `;
    const { rows } = await pool.query(selectQuery, [college_id]);


    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching internships:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

module.exports = router;
