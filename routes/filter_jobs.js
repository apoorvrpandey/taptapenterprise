const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config');
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');
const cacheManager = require('../utlis/cacheManager'); // Ensure you have a cache manager module

// Route to fetch all data with caching
router.get('/all_data', isAuthenticated, async (req, res) => {
  const college_id = req.user.college || null;

  if (!college_id) {
    return res.status(400).json({ error: 'college_id is not set in the session.' });
  }

  const cacheKey = `all_data_${college_id}`;

  try {
    // Check if cached data exists
    let cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const sqlDriveTypes = `
      SELECT DISTINCT jp.drive_type
      FROM job_post jp
      INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
      INNER JOIN "user" u ON jprs.student_id = u.id
      INNER JOIN college c ON u.college_id = c.id
      WHERE c.id = $1 AND jp.status = 'published';
    `;
    const sqlDatePosted = `
      SELECT DISTINCT TO_CHAR(jp.create_at, 'YYYY-MM-DD') AS date_posted
      FROM job_post jp
      INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
      INNER JOIN "user" u ON jprs.student_id = u.id
      INNER JOIN college c ON u.college_id = c.id
      WHERE c.id = $1 AND jp.status = 'published';
    `;
    const sqlCompanies = `
      SELECT DISTINCT jp.company_title
      FROM job_post jp
      INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
      INNER JOIN "user" u ON jprs.student_id = u.id
      INNER JOIN college c ON u.college_id = c.id
      WHERE c.id = $1 AND jp.status = 'published';
    `;
    const sqlPackage = `
      SELECT DISTINCT
      CASE
          WHEN jp.is_ctc_required = TRUE THEN CONCAT(jp.min_salary_lpa, ' LPA - ', jp.max_salary_lpa, ' LPA')
          ELSE 'Not disclosed'
      END AS salary_range_or_not_disclosed
      FROM job_post jp
      INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
      INNER JOIN "user" u ON jprs.student_id = u.id
      INNER JOIN college c ON u.college_id = c.id
      WHERE c.id = $1 AND jp.status = 'published';
    `;
    const sqlEmploymentTypes = `
      SELECT DISTINCT jp.employment_type
      FROM job_post jp
      INNER JOIN job_post_recruitment_status jprs ON jp.id = jprs.job_post_id
      INNER JOIN "user" u ON jprs.student_id = u.id
      INNER JOIN college c ON u.college_id = c.id
      WHERE c.id = $1 AND jp.status = 'published';
    `;

    const queryParams = [college_id];

    // Execute all queries in parallel
    const [driveTypesResult, datePostedResult, companiesResult, packageResult, employmentTypesResult] = await Promise.all([
      pool.query(sqlDriveTypes, queryParams),
      pool.query(sqlDatePosted, queryParams),
      pool.query(sqlCompanies, queryParams),
      pool.query(sqlPackage, queryParams),
      pool.query(sqlEmploymentTypes, queryParams)
    ]);

    // Extracting the results
    const driveTypes = driveTypesResult.rows.map(row => row.drive_type);
    const datePosted = datePostedResult.rows.map(row => row.date_posted);
    const companies = companiesResult.rows.map(row => row.company_title);
    const package = packageResult.rows.map(row => row.salary_range_or_not_disclosed);
    const employmentTypes = employmentTypesResult.rows.map(row => row.employment_type);

    // Combine all the results into one object
    const allData = {
      driveTypes,
      datePosted,
      companies,
      package,
      employmentTypes
    };

    // Cache the data in DynamoDB
    await cacheManager.setCachedData(cacheKey, allData);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const [refreshedDriveTypesResult, refreshedDatePostedResult, refreshedCompaniesResult, refreshedPackageResult, refreshedEmploymentTypesResult] = await Promise.all([
        pool.query(sqlDriveTypes, queryParams),
        pool.query(sqlDatePosted, queryParams),
        pool.query(sqlCompanies, queryParams),
        pool.query(sqlPackage, queryParams),
        pool.query(sqlEmploymentTypes, queryParams)
      ]);

      const refreshedDriveTypes = refreshedDriveTypesResult.rows.map(row => row.drive_type);
      const refreshedDatePosted = refreshedDatePostedResult.rows.map(row => row.date_posted);
      const refreshedCompanies = refreshedCompaniesResult.rows.map(row => row.company_title);
      const refreshedPackage = refreshedPackageResult.rows.map(row => row.salary_range_or_not_disclosed);
      const refreshedEmploymentTypes = refreshedEmploymentTypesResult.rows.map(row => row.employment_type);

      const refreshedData = {
        driveTypes: refreshedDriveTypes,
        datePosted: refreshedDatePosted,
        companies: refreshedCompanies,
        package: refreshedPackage,
        employmentTypes: refreshedEmploymentTypes
      };

      await cacheManager.setCachedData(cacheKey, refreshedData);
      console.log(`Cache refreshed for key ${cacheKey}`);
    });

    // Return all data as JSON
    res.json(allData);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
