const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');

// Database connection pool
const pool = new Pool(dbConfig);

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });

router.get('/data', async (req, res) => {
    try {
        const selectQuery = `SELECT * FROM report.batch`;
        const result = await pool.query(selectQuery);

        if (result.rows.length === 0) {
            return res.status(404).send('Batches not found');
        }

        res.json(result.rows); // Return all rows as an array
    } catch (error) {
        console.error('Error retrieving training:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});



router.post('/upload-batch-details', (req, res) => {
    const batch_id = req.body.batch_id;
    const selected_data = req.body.selected_data; // This should be an array of selected rows

    // Define a function to insert a single row of data into the database
    const insertRow = (rowData) => {
        const query = 'INSERT INTO report.batch_data (batch_id, name, email, regno, phone, college_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email, batch_id) DO UPDATE SET name = $2, regno = $4, phone = $5, college_id = $6';
        const values = [batch_id, rowData.name, rowData.email, rowData.regno, rowData.phone,rowData.college_id];

        pool.query(query, values, (error) => {
            if (error) {
                console.error('Error inserting data:', error);
                throw error;
            }
            // Continue processing or handle success if needed
        });
    };

    try {
        // Parse the selected_data and insert each row into the database
        selected_data.forEach(rowData => {
            insertRow(rowData);
        });

        // Send response once all rows have been inserted
        res.json({ message: 'Batch details uploaded successfully' });
    } catch (error) {
        console.error('Error processing batch details:', error);
        res.status(500).json({ message: 'Failed to upload batch details. Please try again.' });
    }
});



router.post('/add', async (req, res) => {
  const { batch_title } = req.body;

  try {
    if (!batch_title) {
      return res.status(400).send('Batch title is required');
    }

    // Get the maximum batch_id currently in use
    const getMaxIdQuery = 'SELECT COALESCE(MAX(id), 0) AS max_id FROM report.batch';
    const maxIdResult = await pool.query(getMaxIdQuery);
    const nextBatchId = maxIdResult.rows[0].max_id + 1;

    // Insert new batch with calculated batch_id
    const insertQuery = 'INSERT INTO report.batch (id, batch_title) VALUES ($1, $2) RETURNING id, batch_title';
    const values = [nextBatchId, batch_title];
    const result = await pool.query(insertQuery, values);

    if (result.rows.length === 0) {
      return res.status(400).send('Failed to add batch');
    }

    res.json(result.rows[0]); // Return the newly added batch
  } catch (error) {
    console.error('Error adding batch:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

router.post('/upload-batch-details-csv', upload.single('csvFile'), async (req, res) => {
    const batch_id = req.body.batchSelect;
    const results = [];
    const uniqueEntries = new Set(); // To store unique entries
    const duplicateEntries = []; // To store duplicate entries
    const entryKeys = new Set(); // To check duplicates in the file itself

    if (!batch_id) {
        return res.status(400).json({ error: 'Batch ID is required.' });
    }

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            const entryKey = `${data.email}`; // Adjust key based on uniqueness criteria
            if (!entryKeys.has(entryKey)) {
                entryKeys.add(entryKey);
                results.push(data);
            } else {
                duplicateEntries.push(data);
            }
        })
        .on('end', async () => {
            console.log('CSV parsing results:', results);
            fs.unlinkSync(req.file.path);

            try {
                // Check for existing duplicates in the database
                const duplicateCheckQuery = 'SELECT name, email, regno FROM report.batch_data WHERE email = $1 AND batch_id = $2';
                const insertQuery = 'INSERT INTO report.batch_data (batch_id, name, email, regno, phone, college_id) VALUES ($1, $2, $3, $4, $5, $6)';

                const uniqueData = [];
                for (const record of results) {
                    const { name, email, regno, phone, college_id } = record;
                    const existingRecord = await pool.query(duplicateCheckQuery, [email, batch_id]);

                    if (existingRecord.rows.length > 0) {
                        duplicateEntries.push(record);
                    } else {
                        uniqueData.push(record);
                    }
                }

                // Insert unique data into the database
                await Promise.all(uniqueData.map(rowData => {
                    const values = [batch_id, rowData.name, rowData.email, rowData.regno || null, rowData.phone || null, rowData.college_id || null];
                    return pool.query(insertQuery, values);
                }));

                res.json({
                    message: 'Batch details uploaded successfully',
                    duplicateCount: duplicateEntries.length, // Total number of duplicates
                    duplicates: duplicateEntries // Return duplicate entries
                });
            } catch (error) {
                console.error('Error inserting data into database:', error);
                res.status(500).json({ error: 'An error occurred while uploading batch details.' });
            }
        });
});

router.post('/batch-details', (req, res) => {
    const batch_id = req.body.batch_id;
  
    // Log batch_id to ensure it's received correctly
    console.log('Received batch_id:', batch_id);
  
    // Query to get batch data from the database
    const query = `
      SELECT name, email, regno, phone
      FROM report.batch_data
      WHERE batch_id = $1
    `;
    const values = [batch_id];
  
    pool.query(query, values, (error, result) => {
      if (error) {
        console.error('Error fetching batch data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch batch data. Please try again.' });
        return;
      }
  
      const batchData = result.rows;
  
      // Log the retrieved batch data
      console.log('Batch data retrieved:', batchData);
  
      // Return batch data in the response
      res.json({ success: true, batch_data: batchData });
    });
  });


  router.get('/data/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received ID:', id); // Log the received ID

    try {
        const selectQuery = 'SELECT * FROM report.batch_data where batch_id=1;';
        const result = await pool.query(selectQuery, [id]);

        console.log('Query Result:', result.rows); // Log the query result

        if (result.rows.length === 0) {
            console.log('Batch data not found');
            return res.status(404).send('Batch data not found');
        }

        res.json(result.rows); // Return all rows as an array
    } catch (error) {
        console.error('Error retrieving batch data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});


  
router.get('/Batchdata/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const selectQuery = 'SELECT * FROM report.batch_data WHERE batch_id = $1';
        const result = await pool.query(selectQuery, [id]);

        console.log('Query Result:', result.rows); // Log the query result

        if (result.rows.length === 0) {
            console.log('Batch data not found');
            return res.status(404).send('Batch data not found');
        }

        res.json(result.rows); // Return all rows as an array
    } catch (error) {
        console.error('Error retrieving batch data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});






  
  
  

module.exports = router;
