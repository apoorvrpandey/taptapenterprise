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
router.get('/training_assessments/:trainingId', async (req, res) => {
  const { trainingId } = req.params;

  try {
    const results = await pool1.query( "SELECT phase.id AS phase_id, pa.assessment_id FROM report.phase INNER JOIN report.phase_assessment pa ON phase.id = pa.phase_id WHERE training_id = $1", [trainingId]);

    res.json(results.rows);
  } catch (error) {
    console.error('Error fetching training assessments:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch assessment details based on phase ID
router.get('/phase_assessments/:phaseId', async (req, res) => {
  const phaseId = req.params.phaseId;

  try {
    const result = await pool1.query('SELECT id,phase_id, assessment_id FROM report.phase_assessment WHERE phase_id = $1', [phaseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessments for phase:', error.message);
    res.status(500).json({ error: 'Failed to fetch assessments for phase' });
  }
});

router.post('/add_assessment/', async (req, res) => {
  const { phase_id, assessment_ids } = req.body;

  if (!phase_id || !assessment_ids || !assessment_ids.length) {
    return res.status(400).json({ error: 'Phase ID and at least one assessment ID are required' });
  }

  const client = await pool1.connect();

  try {
    await client.query('BEGIN');

    // Insert each assessment ID for the phase
    const insertPromises = assessment_ids.map(assessment_id => {
      return client.query(
        'INSERT INTO report.phase_assessment (phase_id, assessment_id) VALUES ($1, $2)',
        [phase_id, assessment_id]
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
  const id = req.params.id;

  try {
      console.log('Attempting to delete assessment with ID:', id);

      // Perform deletion operation in your database using id
      const result = await pool1.query('DELETE FROM report.phase_assessment WHERE id = $1 RETURNING phase_assessment.phase_id', [id]);

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
