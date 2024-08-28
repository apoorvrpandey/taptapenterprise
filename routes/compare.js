const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const cacheManager = require('../utlis/cacheManager');
const isAuthenticated = require('../jwtAuth.js');

router.get('/hackathon/:id', isAuthenticated, async (req, res) => {
  try {
    const hackathon_id = req.params.id;

    const sql = `SELECT title FROM hackathon WHERE id = $1`;
    const { rows } = await pool.query(sql, [hackathon_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});



router.get('/hackathons',isAuthenticated, async (req, res) => {
  try {
    // Check if the college code is set in the session
    const college_id = req.user.college || null;

    if (!college_id) {
      return res.status(400).json({ error: 'College code is not set in the session.' });
    }


    // SQL query to fetch the required data
    const sql = `
    SELECT  h.id,h.title
FROM user_hackathon_participation uhp
INNER JOIN hackathon h ON uhp.hackathon_id = h.id
INNER JOIN report.assessments_scores rs on h.id = rs.hackathon_id
INNER JOIN "user" u ON uhp.user_id = u.id and rs.user_id = u.id
INNER JOIN college c ON u.college_id = c.id
WHERE c.id = $1 AND test_type_id IN (6, 54)
GROUP BY h.id, h.title




    `;

    // Execute the query with parameter binding
    const { rows } = await pool.query(sql, [college_id]);

    
    // Send the response
    res.json(rows);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});


router.get('/participant_count', isAuthenticated, async (req, res) => {
  try {
    const college_id = req.user.college || null;
    const hackathon_id = req.query.hackathon_id || null;
    console.log('Received college_id:', college_id, 'Received hackathon_id:', hackathon_id);

    if (!college_id || !hackathon_id) {
      return res.status(400).json({ error: 'College ID or Hackathon ID is not provided.' });
    }

    const sql = `
      SELECT h.id, h.title, COUNT(uhp.user_id) AS participant_count
      FROM user_hackathon_participation uhp
      INNER JOIN hackathon h ON uhp.hackathon_id = h.id
      INNER JOIN report.assessments_scores rs ON h.id = rs.hackathon_id
      INNER JOIN "user" u ON uhp.user_id = u.id AND rs.user_id = u.id
      INNER JOIN college c ON u.college_id = c.id
      WHERE c.id = $1 AND h.id = $2
      GROUP BY h.id, h.title;
    `;
    const { rows } = await pool.query(sql, [college_id, hackathon_id]);
    console.log('Query result:', rows);

    res.json(rows);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

  

router.get('/average_scores', isAuthenticated, async (req, res) => {
    try {
      // Check if the college code and hackathon ID are set in the session or query parameters
      const college_id = req.user.college || req.query.college_id || null;
      const hackathon_id = req.query.hackathon_id || null;
  
      if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
      }
  
      if (!hackathon_id) {
        return res.status(400).json({ error: 'Hackathon ID is not provided.' });
      }
  
      // SQL query to fetch the required data
      const sql = `
        SELECT
    assessments_scores.hackathon_id,
    h.title,
    AVG(assessments_scores.total_score) AS average_marks,
    AVG(assessments_scores.aptitude) AS average_aptitude,
    AVG(assessments_scores.english) AS average_english,
    AVG(assessments_scores.coding) AS average_coding
FROM
    report.assessments_scores
INNER JOIN
    hackathon h ON assessments_scores.hackathon_id = h.id
INNER JOIN
    "user" u ON assessments_scores.user_id = u.id
INNER JOIN
    college c ON u.college_id = c.id
WHERE
    c.id = $1 AND assessments_scores.hackathon_id = $2
GROUP BY
    assessments_scores.hackathon_id, h.title;`;
  
      // Execute the query with parameter binding
      const { rows } = await pool.query(sql, [college_id, hackathon_id]);
  
      // Send the response
      res.json(rows[0]);
    } catch (error) {
      console.error('Error querying database:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });


  router.get('/assessment_scores', isAuthenticated, async (req, res) => {
    try {
        const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'College code is not set in the session.' });
        }

        const filterType = req.query.filter;

        const validFilters = {
            aptitude: 'aptitude',
            employability: 'total_score',
            coding: 'coding',
            english: 'english'
        };

        if (!filterType || !validFilters[filterType]) {
            return res.status(400).json({ error: 'Invalid filter type.' });
        }

        const minScore = parseInt(req.query.min, 10);
        const maxScore = parseInt(req.query.max, 10);

        if (isNaN(minScore) || isNaN(maxScore)) {
            return res.status(400).json({ error: 'Invalid range parameters. Both min and max are required.' });
        }

        const effectiveMinScore = minScore === 0 ? 0 : minScore + 1;

        const countSql = `
            SELECT COUNT(*) as count
            FROM 
                report.assessments_scores
            INNER JOIN 
                hackathon h ON assessments_scores.hackathon_id = h.id
            INNER JOIN 
                "user" u ON assessments_scores.user_id = u.id
            INNER JOIN 
                college c ON u.college_id = c.id
            WHERE 
                c.id = $1 AND assessments_scores.hackathon_id = $2
                AND ${validFilters[filterType]} BETWEEN $3 AND $4;
        `;

        const params = [college_id, req.query.hackathon_id, effectiveMinScore, maxScore];

        const { rows } = await pool.query(countSql, params);
        const count = rows[0].count;

        res.json({ count });

    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});








router.get('/employability_band_counts', isAuthenticated, async (req, res) => {
    try {
      // Check if the college code and hackathon ID are provided in the query parameters
      const college_id = req.user.college || null;
      const hackathon_id = parseInt(req.query.hackathon_id, 10);
  
      if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
      }
  
      if (!hackathon_id) {
        return res.status(400).json({ error: 'Hackathon ID is required.' });
      }
  
      // SQL query to fetch the required data
      const sql = `
      SELECT
          assessments_emp_bands.hackathon_id,
          COUNT(CASE WHEN assessments_emp_bands.current_employability_band = 'A++' THEN 1 END) AS count_A_plus_plus,
          COUNT(CASE WHEN assessments_emp_bands.current_employability_band = 'A+' THEN 1 END) AS count_A_plus,
          COUNT(CASE WHEN assessments_emp_bands.current_employability_band = 'A' THEN 1 END) AS count_A,
          COUNT(CASE WHEN assessments_emp_bands.current_employability_band = 'B' THEN 1 END) AS count_B,
          COUNT(CASE WHEN assessments_emp_bands.current_employability_band = 'C' THEN 1 END) AS count_C,
          COUNT(CASE WHEN assessments_emp_bands.current_employability_band = 'F' THEN 1 END) AS count_F,
          COUNT(CASE WHEN assessments_emp_bands.possible_employability_band = 'A++' THEN 1 END) AS count_A_plus_plus_possible,
          COUNT(CASE WHEN assessments_emp_bands.possible_employability_band = 'A+' THEN 1 END) AS count_A_plus_possible,
          COUNT(CASE WHEN assessments_emp_bands.possible_employability_band = 'A' THEN 1 END) AS count_A_possible,
          COUNT(CASE WHEN assessments_emp_bands.possible_employability_band = 'B' THEN 1 END) AS count_B_possible,
          COUNT(CASE WHEN assessments_emp_bands.possible_employability_band = 'C' THEN 1 END) AS count_C_possible,
          COUNT(CASE WHEN assessments_emp_bands.possible_employability_band = 'F' THEN 1 END) AS count_F_possible
      FROM
          report.assessments_emp_bands
      INNER JOIN
          hackathon h ON assessments_emp_bands.hackathon_id = h.id
      INNER JOIN
          "user" u ON assessments_emp_bands.user_id = u.id
      INNER JOIN
          college c ON u.college_id = c.id
      WHERE
          c.id = $1
          AND assessments_emp_bands.hackathon_id = $2
      GROUP BY
          assessments_emp_bands.hackathon_id;
      `;
  
      // Execute the query with parameter binding
      const { rows } = await pool.query(sql, [college_id, hackathon_id]);
  
      // Send the response
      res.json(rows);
    } catch (error) {
      console.error('Error querying database:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

module.exports = router;


