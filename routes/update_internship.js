const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const multer = require('multer');
const AWS = require('aws-sdk');
const dbConfig = require('../db_config');
const isAuthenticated = require('../jwtAuth.js');
const pool = new Pool(dbConfig);
const dotenv = require('dotenv');
dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const upload = multer({ storage: multer.memoryStorage() });

async function getInternshipById(internshipId) {
  const query = `SELECT * FROM report.internships WHERE id = $1`;
  const result = await pool.query(query, [internshipId]);
  return result.rows[0];
}

router.post('/update/:id', upload.single('banner_image'), async (req, res) => {
  const internshipId = req.params.id;
  const { internship_title, internship_description, internship_hours, internship_start_date, internship_end_date } = req.body;

  console.log(`Received update request for internship ID: ${internshipId}`);
  console.log('Request body:', req.body);

  let bannerUrl;

  if (req.file) {
    console.log('File uploaded:', req.file.originalname);

    const params = {
      Bucket: process.env.BUCKET,
      Key: `${Date.now()}_${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    try {
      console.log('Uploading file to S3...');
      const s3Data = await s3.upload(params).promise();
      bannerUrl = s3Data.Location;
      console.log('File uploaded successfully. S3 URL:', bannerUrl);
    } catch (error) {
      console.error('Error uploading to S3:', error);
      return res.status(500).send('Error uploading banner image');
    }
  } else {
    console.log('No file uploaded. Fetching existing banner URL.');
    try {
      const existingInternship = await getInternshipById(internshipId);
      bannerUrl = existingInternship.banner;
      console.log('Existing banner URL:', bannerUrl);
    } catch (error) {
      console.error('Error fetching existing internship details:', error);
      return res.status(500).send('Error fetching existing internship details');
    }
  }

  const values = [
    internship_title, 
    internship_description, 
    internship_hours, 
    internship_start_date, 
    internship_end_date, 
    bannerUrl, 
    internshipId
  ];

  try {
    console.log('Updating internship details in database...');
    const query = `
      UPDATE report.internships
      SET 
        title = $1,
        description = $2,
        total_hours = $3,
        start_date = $4,
        end_date = $5,
        banner = $6
      WHERE 
        id = $7
    `;

    await pool.query(query, values);

    console.log('Internship details updated successfully');
    res.status(200).send('Internship details updated successfully');
  } catch (error) {
    console.error('Error updating internship details:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
