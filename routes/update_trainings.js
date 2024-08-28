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
async function getTrainingById(trainingId) {
  const query = `SELECT * FROM report.trainings WHERE id = $1`;
  const result = await pool.query(query, [trainingId]);
  return result.rows[0];
}
router.post('/update/:id', upload.single('banner_image'), async (req, res) => {
  const trainingId = req.params.id;
  const { training_title, training_description, training_hours, training_start_date, training_end_date } = req.body;
  let bannerUrl;

  if (req.file) {
    const params = {
      Bucket: process.env.BUCKET,
      Key: `${Date.now()}_${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    try {
      const s3Data = await s3.upload(params).promise();
      bannerUrl = s3Data.Location;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      return res.status(500).send('Error uploading banner image');
    }
  } else {
    // If no file is uploaded, use the existing banner URL
    const existingTraining = await getTrainingById(trainingId); // assume this function exists
    bannerUrl = existingTraining.banner;
  }

  const values = [training_title, training_description, training_hours, training_start_date, training_end_date, bannerUrl, trainingId];

  try {
    const query = `
      UPDATE report.trainings
      SET 
        title = $1,
        description = $2,
        total_training_hours = $3,
        start_date = $4,
        end_date = $5,
        banner = $6
      WHERE 
        id = $7
    `;

    await pool.query(query, values);

    res.status(200).send('Training details updated successfully');
  } catch (error) {
    console.error('Error updating training details:', error);
    res.status(500).send('Internal Server Error');
  }
});
module.exports = router;