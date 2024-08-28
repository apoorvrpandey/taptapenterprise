const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');

// Database connection pool
const pool = new Pool(dbConfig);

// Fetch domains for an internship
router.get('/domains_data/:internshipId', async (req, res) => {
  const { internshipId } = req.params;
  console.log(`Fetching domains for internshipId: ${internshipId}`);
  try {
    const result = await pool.query('SELECT DISTINCT domain.* FROM report.internship_domain AS domain INNER JOIN report.internship_batch AS internship_batch ON domain.id = internship_batch.domain_id WHERE domain.internship_id= $1', [internshipId]);
    console.log(`Domains fetched successfully for internshipId: ${internshipId}`);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching domains for internshipId: ${internshipId}:`, error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

router.post('/create_domain/:internshipId/domain/:domainIndex', async (req, res) => {
  const { internshipId, domainIndex } = req.params;
  const domain = req.body;

  // Log the received parameters and body
  console.log(`Received POST request to create/update domain`);
  console.log(`internshipId: ${internshipId}, domainIndex: ${domainIndex}`);
  console.log('Received domain data:', JSON.stringify(domain, null, 2));

  try {
    await pool.query('BEGIN');

    let domainId;
    const { title, start_date, end_date, hours, live_sessions, assessments, mock_interviews, webinars, student_reviews, batch_ids } = domain;

    if (!Array.isArray(batch_ids)) {
      throw new Error('batch_ids must be an array');
    }

    // Check if the phase with the specific internship_id and title already exists
    const checkExistingPhaseQuery = `
      SELECT id FROM report.internship_domain 
      WHERE internship_id = $1 AND title = $2
    `;
    const existingPhaseResult = await pool.query(checkExistingPhaseQuery, [internshipId, title]);
    console.log(`Checked existing domain for internshipId: ${internshipId}, title: ${title}`);

    if (existingPhaseResult.rows.length > 0) {
      // If the phase exists, update it
      domainId = existingPhaseResult.rows[0].id;
      const updatePhaseQuery = `
        UPDATE report.internship_domain
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
        domainId
      ]);
      console.log(`Domain updated: ${domainId}`);
    } else {
      // Insert the new phase
      const insertPhaseQuery = `
        INSERT INTO report.internship_domain (internship_id, title, start_date, end_date, hours, live_sessions, assessments, mock_interviews, webinars, student_reviews) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      const phaseResult = await pool.query(insertPhaseQuery, [
        internshipId,
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
      domainId = phaseResult.rows[0].id;
      console.log(`Domain created: ${domainId}`);
    }

    // Ensure the phase is associated with multiple batches
    const phaseBatchQuery = `
      INSERT INTO report.internship_batch (domain_id, batch_id)
      VALUES ($1, $2)
      ON CONFLICT (domain_id, batch_id) DO NOTHING
    `;
    for (const batchId of batch_ids) {
      await pool.query(phaseBatchQuery, [domainId, batchId]);
      console.log(`Batch association added for domainId: ${domainId}, batchId: ${batchId}`);
    }

    await pool.query('COMMIT');
    console.log(`Domain transaction committed for internshipId: ${internshipId}, domainIndex: ${domainIndex}`);
    res.status(200).json({ message: 'Domain saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`Error saving domain for internshipId: ${internshipId}, domainIndex: ${domainIndex}:`, error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update_domain/:domainId', async (req, res) => {
  const { domainId } = req.params;
  const { title, start_date, end_date, hours, live_sessions, assessments, mock_interviews, webinars, student_reviews, batch_ids } = req.body;
  console.log(`Updating domainId: ${domainId}`);

  try {
    await pool.query('BEGIN');

    if (!Array.isArray(batch_ids)) {
      throw new Error('batch_ids must be an array');
    }

    // Check if the phase with the specific domain_id already exists
    const checkExistingPhaseQuery = `
      SELECT id FROM report.internship_domain 
      WHERE id = $1
    `;
    const existingPhaseResult = await pool.query(checkExistingPhaseQuery, [domainId]);
    console.log(`Checked existing domain for domainId: ${domainId}`);

    if (existingPhaseResult.rows.length > 0) {
      // If the phase exists, update it
      const updatePhaseQuery = `
        UPDATE report.internship_domain
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
        domainId
      ]);
      console.log(`Domain updated: ${domainId}`);
    } else {
      res.status(404).json({ error: 'Domain not found' });
      await pool.query('ROLLBACK');
      console.log(`Domain not found for domainId: ${domainId}`);
      return;
    }

    // Ensure the phase is associated with multiple batches
    const phaseBatchQuery = `
      INSERT INTO report.internship_batch (domain_id, batch_id)
      VALUES ($1, $2)
      ON CONFLICT (domain_id, batch_id) DO NOTHING
    `;
    for (const batchId of batch_ids) {
      await pool.query(phaseBatchQuery, [domainId, batchId]);
      console.log(`Batch association added for domainId: ${domainId}, batchId: ${batchId}`);
    }

    await pool.query('COMMIT');
    console.log(`Domain transaction committed for domainId: ${domainId}`);
    res.status(200).json({ message: 'Domain updated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`Error updating domain for domainId: ${domainId}:`, error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a domain by ID
router.delete('/delete_domain/:domainId', async (req, res) => {
  const { domainId } = req.params;
  console.log(`Deleting domainId: ${domainId}`);

  try {
    // First, delete related records from the phase_batch table
    await pool.query('DELETE FROM report.internship_batch WHERE domain_id = $1', [domainId]);
    console.log(`Related batch associations deleted for domainId: ${domainId}`);

    // Then, delete the phase record
    await pool.query('DELETE FROM report.internship_domain WHERE id = $1', [domainId]);
    console.log(`Domain deleted: ${domainId}`);

    res.status(200).json({ message: 'Domain deleted successfully' });
  } catch (error) {
    console.error(`Error deleting domain for domainId: ${domainId}:`, error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

module.exports = router;
