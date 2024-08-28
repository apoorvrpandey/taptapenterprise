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
router.get('/live_sessions/:internshipId', async (req, res) => {
  const { internshipId } = req.params;

  try { 
    const results = await pool.query(" select internship_id,id.id as domain_id,ils.event_id from report.internship_domain id INNER JOIN report.internship_live_sessions ils on id.id = ils.domain_id where internship_id = $1", [internshipId]);

    res.json(results.rows);
  } catch (error) {
    console.error('Error fetching live session details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Fetch live session details based on phase ID
router.get('/domain_live_sessions/:domainId', async (req, res) => {
  const domainId = req.params.domainId;

  try {
    const result = await pool.query('SELECT id,domain_id, event_id FROM report.internship_live_sessions WHERE domain_id = $1', [domainId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching live sessions for domain:', error.message);
    res.status(500).json({ error: 'Failed to fetch live sessions for domain' });
  }
});

router.post('/add_live_sessions/', async (req, res) => {
  const { domain_id, event_ids } = req.body;

  if (!domain_id || !event_ids || !event_ids.length) {
    return res.status(400).json({ error: 'Phase ID and at least one event ID are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert each assessment ID for the phase
    const insertPromises = event_ids.map(event_id => {
      return client.query(
        'INSERT INTO report.internship_live_sessions (domain_id, event_id) VALUES ($1, $2)',
        [domain_id, event_id]
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
      const result = await pool.query('DELETE FROM report.internship_live_sessions WHERE id = $1 RETURNING internship_live_sessions.domain_id', [id]);
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
