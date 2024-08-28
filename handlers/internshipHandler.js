const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool(dbConfig);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

async function internshipFormSubmission(req, res) {
  try {
    if (!req.file) {
      return res.status(400).send('No banner image uploaded.');
    }

    const file = req.file;
    const filename = `${uuidv4()}-${file.originalname}`;
    const s3Params = {
      Bucket: process.env.BUCKET,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    console.log('File uploaded:', file);
    console.log('S3 params:', s3Params);

    const {
      internship_title,
      internship_description,
      internship_hours,
      internshiptypeInput,
      internship_start_date,
      internship_end_date
    } = req.body;

    // Logging form data
    console.log("Form Data:");
    console.log("internship Title:", internship_title);
    console.log("Description of internship:", internship_description);
    console.log("No. of Hours:", internship_hours);
    console.log("internship Type ID:", internshiptypeInput);
    console.log("internship Start Date:", internship_start_date);
    console.log("internship End Date:", internship_end_date);

    // Uploading file to S3
    const s3UploadResult = await s3.upload(s3Params).promise();
    
    const bannerUrl = s3UploadResult.Location;
    console.log("S3 Upload Result:", s3UploadResult);
    console.log('Banner URL:', bannerUrl);
    // Insert new registration with file URL
    const insertQuery = `
      INSERT INTO report.internships (
        title, 
        description, 
        total_hours, 
        internship_type_id, 
        start_date, 
        end_date,
        banner
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await pool.query(insertQuery, [
      internship_title, 
      internship_description, 
      internship_hours, 
      internshiptypeInput,  
      internship_start_date, 
      internship_end_date, 
      bannerUrl
    ]);

    res.status(200).send('Form submitted successfully');
  } catch (error) {
    console.error('Error submitting form:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
}

module.exports = { internshipFormSubmission };
