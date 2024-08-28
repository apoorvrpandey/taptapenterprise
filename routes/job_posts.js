const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config');
const cacheManager = require('../utlis/cacheManager.js');
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');

// Function to generate cache key based on request query parameters
const generateCacheKey = (collegeId, filters) => {
  const { driveTypes, salaryRanges, employmentTypes, companies } = filters;
  return `job_posts_${collegeId}_${driveTypes || 'all'}_${salaryRanges || 'all'}_${employmentTypes || 'all'}_${companies || 'all'}`;
};


// Route to fetch job posts with caching
router.get('/job_posts',isAuthenticated, async (req, res) => {
  const collegeId = req.user.college || null;

  if (!collegeId) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  const { driveTypes, salaryRanges, employmentTypes, companies } = req.query;
  const filters = { driveTypes, salaryRanges, employmentTypes, companies };
  const cacheKey = generateCacheKey(collegeId, filters);

  try {
    // Check if cached data exists
    let cachedData = await cacheManager.getCachedData(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let sql = `
      SELECT
          jp.id AS job_post_id,
          jp.company_title,
          to_char(jp.create_at, 'YYYY-MM-DD') AS create_at,
          jp.drive_type,
          jp.job_post_title,
          jp.job_post_logo_url,
          jp.description,
          CASE
              WHEN jp.is_ctc_required = TRUE THEN CONCAT(jp.min_salary_lpa, ' LPA - ', jp.max_salary_lpa, ' LPA')
              ELSE 'Not disclosed'
          END AS salary_range_or_not_disclosed,
          jp.employment_type,
          jp.office_mode,
          jp.open_drive_link,
          COALESCE(counts.count, 0) AS drive_count
      FROM
          job_post jp
      LEFT JOIN
          (
              SELECT
                  jpr.job_post_id,
                  COUNT(jpr.student_id) AS count
              FROM
                  job_post_recruitment_status jpr
              INNER JOIN
                  job_post jp2 ON jpr.job_post_id = jp2.id
              INNER JOIN
                  "user" u ON jpr.student_id = u.id
              INNER JOIN
                  college c ON u.college_id = c.id
              WHERE
                  c.id = $1
              GROUP BY
                  jpr.job_post_id
          ) AS counts ON jp.id = counts.job_post_id
      WHERE
          jp.status = 'published'
          AND COALESCE(counts.count, 0) > 0
    `;

    const queryParams = [collegeId];
    let filterIndex = 2; // Start from 2 because 1 is used for collegeId

    if (driveTypes) {
      sql += ` AND jp.drive_type = ANY($${filterIndex})`;
      queryParams.push(driveTypes.split(','));
      filterIndex++;
    }
    if (salaryRanges) {
      const salaryConditions = salaryRanges.split(',').map((range, index) => {
        const [min, max] = range.split(' LPA - ');
        queryParams.push(parseFloat(min), parseFloat(max));
        return `(jp.min_salary_lpa >= $${filterIndex + index * 2} AND jp.max_salary_lpa <= $${filterIndex + index * 2 + 1})`;
      });
      sql += ` AND (${salaryConditions.join(' OR ')})`;
      filterIndex += salaryConditions.length * 2;
    }
    if (employmentTypes) {
      sql += ` AND jp.employment_type = ANY($${filterIndex})`;
      queryParams.push(employmentTypes.split(','));
      filterIndex++;
    }
    if (companies) {
      sql += ` AND jp.company_title = ANY($${filterIndex})`;
      queryParams.push(companies.split(','));
      filterIndex++;
    }

    const { rows } = await pool.query(sql, queryParams);

    // Cache the data in DynamoDB
    await cacheManager.setCachedData(cacheKey, rows);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const { rows: refreshedData } =  await pool.query(sql, queryParams);
      if (refreshedData.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedData);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    // Return the results
    res.json(rows);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});


// Route to fetch a single job post by job_post_id with caching
router.get('/job_posts/:job_post_id', isAuthenticated, async (req, res) => {
  const collegeId = req.user.college || null;

  if (!collegeId) {
    return res.status(400).json({ error: 'College code is not set in the session.' });
  }

  const { job_post_id } = req.params;
  const cacheKey = generateCacheKey(collegeId, { job_post_id });

  try {
    // Check if cached data exists
    let cachedData = await cacheManager.getCachedData(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let sql = `
      SELECT
          jp.id AS job_post_id,
          jp.company_title,
          to_char(jp.create_at, 'YYYY-MM-DD') AS create_at,
          jp.drive_type,
          jp.job_post_title,
          jp.job_post_logo_url,
          jp.description,
          CASE
              WHEN jp.is_ctc_required = TRUE THEN CONCAT(jp.min_salary_lpa, ' LPA - ', jp.max_salary_lpa, ' LPA')
              ELSE 'Not disclosed'
          END AS salary_range_or_not_disclosed,
          jp.employment_type,
          jp.office_mode,
          jp.open_drive_link,
          COALESCE(counts.count, 0) AS drive_count
      FROM
          job_post jp
      LEFT JOIN
          (
              SELECT
                  jpr.job_post_id,
                  COUNT(jpr.student_id) AS count
              FROM
                  job_post_recruitment_status jpr
              INNER JOIN
                  job_post jp2 ON jpr.job_post_id = jp2.id
              INNER JOIN
                  "user" u ON jpr.student_id = u.id
              INNER JOIN
                  college c ON u.college_id = c.id
              WHERE
                  c.id = $1
              GROUP BY
                  jpr.job_post_id
          ) AS counts ON jp.id = counts.job_post_id
      WHERE
          jp.status = 'published'
          AND jp.id = $2
          AND COALESCE(counts.count, 0) > 0
    `;

    const queryParams = [collegeId, job_post_id];
    const { rows } = await pool.query(sql, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Job post not found.' });
    }

    // Cache the data in DynamoDB
    await cacheManager.setCachedData(cacheKey, rows[0]);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const { rows: refreshedData } =  await pool.query(sql, queryParams);
      if (refreshedData.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedData[0]);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    // Return the result
    res.json(rows[0]);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});





router.get('/bb_job_posts',isAuthenticated, async (req, res) => {

  try {
    // Check if cached data exists
   

    let sql = `
      SELECT
          jp.id AS job_post_id,
          jp.company_title,
          to_char(jp.create_at, 'YYYY-MM-DD') AS create_at,
          jp.drive_type,
          jp.job_post_title,
          jp.job_post_logo_url,
          jp.description,
          CASE
              WHEN jp.is_ctc_required = TRUE THEN CONCAT(jp.min_salary_lpa, ' LPA - ', jp.max_salary_lpa, ' LPA')
              ELSE 'Not disclosed'
          END AS salary_range_or_not_disclosed,
          jp.employment_type,
          jp.office_mode,
          jp.open_drive_link
      FROM
          job_post jp
      LEFT JOIN
          (
              SELECT
                  jpr.job_post_id,
                  COUNT(jpr.student_id) AS count
              FROM
                  job_post_recruitment_status jpr
              INNER JOIN
                  job_post jp2 ON jpr.job_post_id = jp2.id
              INNER JOIN
                  "user" u ON jpr.student_id = u.id
              GROUP BY
                  jpr.job_post_id
          ) AS counts ON jp.id = counts.job_post_id
    WHERE
          jp.status = 'published'
    `;

   

   
    const { rows } = await pool.query(sql);

    // Cache the data in DynamoDB
    

    // Schedule automatic cache refresh
    

    // Return the results
    res.json(rows);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
