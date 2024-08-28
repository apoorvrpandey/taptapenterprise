const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../read_replica_config');
const dbConfig_write = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');

// Database connection pool
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);

// Fetch phases for a training
router.get('/data/', async (req, res) => {
  try {
    const result = await pool1.query('select id, title from hackathon');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching phases:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

 // Fetch assessment details based on training ID
router.get('/assessments/:internshipId', async (req, res) => {
  const { internshipId } = req.params;

  try {
    const results = await pool1.query( "SELECT domain.id AS domain_id, ia.assessment_id FROM report.internship_domain as domain INNER JOIN report.internship_assessment ia ON domain.id = ia.domain_id WHERE internship_id = $1", [internshipId]);

    res.json(results.rows);
  } catch (error) {
    console.error('Error fetching internship assessments:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch assessment details based on phase ID
router.get('/domain_assessments/:domainId', async (req, res) => {
  const domainId = req.params.domainId;

  try {
    const result = await pool1.query('SELECT id,domain_id, assessment_id FROM report.internship_assessment WHERE domain_id = $1', [domainId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessments for domain:', error.message);
    res.status(500).json({ error: 'Failed to fetch assessments for phase' });
  }
});

router.post('/add_assessment/', async (req, res) => {
    const { domain_id, assessment_ids } = req.body;
  
    console.log('Incoming request body:', req.body);
  
    if (!domain_id || !assessment_ids || !assessment_ids.length) {
      return res.status(400).json({ error: 'Phase ID and at least one assessment ID are required' });
    }
  
    const client = await pool1.connect();
  
    try {
      await client.query('BEGIN');
  
      // Insert each assessment ID for the phase  
      const insertPromises = assessment_ids.map(assessment_id => {
        return client.query(
          'INSERT INTO report.internship_assessment (domain_id, assessment_id) VALUES ($1, $2)',
          [domain_id, assessment_id]
        );
      });
  
      await Promise.all(insertPromises);
  
      await client.query('COMMIT');
      res.json({ success: true, message: 'Assessments saved successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving assessments:', error);
      res.status(500).json({ error: 'Failed to save assessments' });
    } finally {
      client.release();
    }
  });
  

// Delete assessment route
router.delete('/delete_assessment/:id', async (req, res) => {
  const domain_id = req.params.id;

  try {
      console.log('Attempting to delete assessment with ID:', id);

      // Perform deletion operation in your database using id
      const result = await pool1.query('DELETE FROM report.internship_assessment WHERE domain_id = $1 RETURNING phase_assessment.domain_id', [domain_id]);

      // Check if any rows were affected
      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Assessment not found' });
      }

      res.json({ success: true, message: 'Assessment deleted successfully' });
  } catch (error) {
      console.error('Error deleting assessment:', error);
      res.status(500).json({ error: 'Failed to delete assessment', details: error.message });
  }
});




module.exports = router;
