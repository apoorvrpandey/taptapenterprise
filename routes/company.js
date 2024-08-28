const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');

// Database connection pool
const pool = new Pool(dbConfig);

// Endpoint to fetch data for the college leaderboard (Average Score)
router.get('/',isAuthenticated, async (req, res) => {
    const company = req.query.company;



  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  

  try {
    const result = await pool.query(
      `SELECT *
       FROM report.company_page
       WHERE company_name = $1;`,
      [company]
    );



    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log(result.rows[0]);

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    return     res.status(500).json({ error: 'Failed to fetch company' });


}
})

module.exports = router;
