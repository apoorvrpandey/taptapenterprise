const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');
// Database connection pool
const pool = new Pool(dbConfig);

// Fetch phases for a training
router.get('/phases_data/:trainingId', async (req, res) => {
  const { trainingId } = req.params;
  try {
    const result = await pool.query('SELECT DISTINCT phase.* FROM report.phase AS phase INNER JOIN report.phase_batch AS phase_batch ON phase.id = phase_batch.phase_id WHERE phase.training_id= $1', [trainingId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching phases:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

router.post('/create_phase/:trainingId/phase/:phaseIndex', async (req, res) => {
  const { trainingId, phaseIndex } = req.params;
  const phase = req.body;

  try {
    await pool.query('BEGIN');

    let phaseId;
    const { title, start_date, end_date, hours, live_sessions, assessments, mock_interviews, webinars, student_reviews, batch_ids } = phase;

    // Check if the phase with the specific training_id and title already exists
    const checkExistingPhaseQuery = `
      SELECT id FROM report.phase 
      WHERE training_id = $1 AND title = $2
    `;
    const existingPhaseResult = await pool.query(checkExistingPhaseQuery, [trainingId, title]);

    if (existingPhaseResult.rows.length > 0) {
      // If the phase exists, update it
      phaseId = existingPhaseResult.rows[0].id;
      const updatePhaseQuery = `
        UPDATE report.phase
        SET title = $1,
            start_date = $2,
            end_date = $3,
            hours = $4,
            live_sessions = $5,
            assessments = $6,
            mock_interviews = $7,
            webinars = $8,
            student_reviews = $9
        WHERE id = $10
        RETURNING id
      `;
      await pool.query(updatePhaseQuery, [
        title,
        start_date,
        end_date,
        hours,
        live_sessions,
        assessments,
        mock_interviews,
        webinars,
        student_reviews,
        phaseId
      ]);
    } else {
      // Insert the new phase
      const insertPhaseQuery = `
        INSERT INTO report.phase (training_id, title, start_date, end_date, hours, live_sessions, assessments, mock_interviews, webinars, student_reviews) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      const phaseResult = await pool.query(insertPhaseQuery, [
        trainingId,
        title,
        start_date,
        end_date,
        hours,
        live_sessions,
        assessments,
        mock_interviews,
        webinars,
        student_reviews
      ]);
      phaseId = phaseResult.rows[0].id;
    }

    // Ensure the phase is associated with multiple batches
    const phaseBatchQuery = `
      INSERT INTO report.phase_batch (phase_id, batch_id)
      VALUES ($1, $2)
      ON CONFLICT (phase_id, batch_id) DO NOTHING
    `;
    for (const batchId of batch_ids) {
      await pool.query(phaseBatchQuery, [phaseId, batchId]);
    }

    await pool.query('COMMIT');
    res.status(200).json({ message: 'Phase saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving phase:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update_phase/:phaseId', async (req, res) => {
  const { phaseId } = req.params;
  const { title, start_date, end_date, hours, live_sessions, assessments, mock_interviews, webinars, student_reviews, batch_ids } = req.body;

  try {
    await pool.query('BEGIN');

    // Check if the phase with the specific phase_id already exists
    const checkExistingPhaseQuery = `
      SELECT id FROM report.phase 
      WHERE id = $1
    `;
    const existingPhaseResult = await pool.query(checkExistingPhaseQuery, [phaseId]);

    if (existingPhaseResult.rows.length > 0) {
      // If the phase exists, update it
      const updatePhaseQuery = `
        UPDATE report.phase
        SET title = $1,
            start_date = $2,
            end_date = $3,
            hours = $4,
            live_sessions = $5,
            assessments = $6,
            mock_interviews = $7,
            webinars = $8,
            student_reviews = $9
        WHERE id = $10
        RETURNING id
      `;
      await pool.query(updatePhaseQuery, [
        title,
        start_date,
        end_date,
        hours,
        live_sessions,
        assessments,
        mock_interviews,
        webinars,
        student_reviews,
        phaseId
      ]);
    } else {
      res.status(404).json({ error: 'Phase not found' });
      await pool.query('ROLLBACK');
      return;
    }

    // Ensure the phase is associated with multiple batches
    const phaseBatchQuery = `
      INSERT INTO report.phase_batch (phase_id, batch_id)
      VALUES ($1, $2)
      ON CONFLICT (phase_id, batch_id) DO NOTHING
    `;
    for (const batchId of batch_ids) {
      await pool.query(phaseBatchQuery, [phaseId, batchId]);
    }

    await pool.query('COMMIT');
    res.status(200).json({ message: 'Phase updated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating phase:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Delete a phase by ID
router.delete('/delete_phase/:phaseId', async (req, res) => {
  const { phaseId } = req.params;

  try {
    // First, delete related records from the phase_batch table
    await pool.query('DELETE FROM report.phase_batch WHERE phase_id = $1', [phaseId]);

    // Then, delete the phase record
    await pool.query('DELETE FROM report.phase WHERE id = $1', [phaseId]);

    res.status(200).json({ message: 'Phase deleted successfully' });
  } catch (error) {
    console.error('Error deleting phase:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});



module.exports = router;
