const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');

// Database connection pool
const pool = new Pool(dbConfig);

// Fetch phases for a training
router.get('/data/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, event_title as title FROM report.events');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching phases:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});


// Route to fetch live session details based on training ID
// Route to fetch live session details based on training ID
router.get('/training_live_sessions/:trainingId', async (req, res) => {
  const { trainingId } = req.params;

  try {
    const results = await pool.query(" SELECT training_id, phase.id AS phase_id, pa.event_id FROM report.phase INNER JOIN report.phase_live_sessions pa ON phase.id = pa.phase_id WHERE training_id = $1", [trainingId]);

    res.json(results.rows);
  } catch (error) {
    console.error('Error fetching live session details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Fetch live session details based on phase ID
router.get('/phase_live_sessions/:phaseId', async (req, res) => {
  const phaseId = req.params.phaseId;

  try {
    const result = await pool.query('SELECT id,phase_id, event_id FROM report.phase_live_sessions WHERE phase_id = $1', [phaseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching live sessions for phase:', error.message);
    res.status(500).json({ error: 'Failed to fetch live sessions for phase' });
  }
});

router.post('/add_live_sessions/', async (req, res) => {
  const { phase_id, event_ids } = req.body;

  if (!phase_id || !event_ids || !event_ids.length) {
    return res.status(400).json({ error: 'Phase ID and at least one event ID are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert each assessment ID for the phase
    const insertPromises = event_ids.map(event_id => {
      return client.query(
        'INSERT INTO report.phase_live_sessions (phase_id, event_id) VALUES ($1, $2)',
        [phase_id, event_id]
      );
    });

    await Promise.all(insertPromises);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Live Sessions saved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving Sessions:', error);
    res.status(500).json({ error: 'Failed to save Sessions' });
  } finally {
    client.release();
  }
});


// Delete livesession route
router.delete('/delete_livesession/:id', async (req, res) => {
  const id = req.params.id;

  try {
      console.log('Attempting to delete livesession with ID:', id);

      // Perform deletion operation in your database using id
      const result = await pool.query('DELETE FROM report.phase_live_sessions WHERE id = $1 RETURNING phase_live_sessions.phase_id', [id]);
      console.log('Deleted data:', result.rows[0]);
      // Check if any rows were affected
      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'LiveSession not found' });
      }

      res.json({ success: true, message: 'LiveSession deleted successfully' });
  } catch (error) {
      console.error('Error deleting LiveSession:', error);
      res.status(500).json({ error: 'Failed to delete LiveSession', details: error.message });
  }
});


module.exports = router;
