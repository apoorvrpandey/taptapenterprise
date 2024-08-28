const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../../read_replica_config.js');
const pool = new Pool(dbConfig);
const cacheManager = require('../../utlis/cacheManager.js');
const isAuthenticated = require('../../jwtAuth.js');

// Function to fetch total job posts count
const fetchTotalJobPosts = async () => {
  const query = 'SELECT COUNT(*) AS total_job_posts FROM job_post';
  const result = await pool.query(query);
  return result.rows[0];
};

// Function to fetch job posts count grouped by company title
const fetchJobPostsByCompany = async () => {
  const query = `
    SELECT company_title, COUNT(*) AS post_count 
    FROM job_post 
    GROUP BY company_title`;
  const result = await pool.query(query);
  return result.rows;
};

// Function to fetch job posts categorized by drive type for each company
const fetchJobPostsByDriveType = async () => {
  const query = `
    SELECT
      company_title,
      SUM(CASE WHEN drive_type = 'BB Exclusive' THEN 1 ELSE 0 END) AS BBExclusive,
      SUM(CASE WHEN drive_type = 'Open Drive' THEN 1 ELSE 0 END) AS OpenDrives
    FROM
      job_post
    GROUP BY
      company_title`;
  const result = await pool.query(query);
  return result.rows;
};

// Function to fetch student recruitment count by college
const fetchStudentRecruitmentCount = async (college_id) => {
  const query = `
    SELECT COUNT(jprs.student_id) AS recruitment_count
    FROM job_post_recruitment_status jprs
    INNER JOIN "user" u ON jprs.student_id = u.id
    INNER JOIN college c ON u.college_id = c.id
    WHERE c.id = $1`;
  const result = await pool.query(query, [college_id]);
  return result.rows[0];
};

router.get('/data', isAuthenticated, async (req, res) => {
  try {
    const college_id = req.user.college;

    if (!college_id) {
      return res.status(400).json({ error: 'college_id is not set in the session.' });
    }

    const cacheKey = `job_insights_${college_id}`;
    let cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const [totalJobPosts, jobPostsByCompany, jobPostsByDriveType, studentRecruitmentCount] = await Promise.all([
      fetchTotalJobPosts(),
      fetchJobPostsByCompany(),
      fetchJobPostsByDriveType(),
      fetchStudentRecruitmentCount(college_id)
    ]);

    cachedData = {
      total_job_posts: totalJobPosts.total_job_posts,
      job_posts_by_company: jobPostsByCompany,
      job_posts_by_drive_type: jobPostsByDriveType,
      student_recruitment_count: studentRecruitmentCount.recruitment_count
    };

    await cacheManager.setCachedData(cacheKey, cachedData);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const [refreshedTotalJobPosts, refreshedJobPostsByCompany, refreshedJobPostsByDriveType, refreshedStudentRecruitmentCount] = await Promise.all([
        fetchTotalJobPosts(),
        fetchJobPostsByCompany(),
        fetchJobPostsByDriveType(),
        fetchStudentRecruitmentCount(college_id)
      ]);

      const refreshedData = {
        total_job_posts: refreshedTotalJobPosts.total_job_posts,
        job_posts_by_company: refreshedJobPostsByCompany,
        job_posts_by_drive_type: refreshedJobPostsByDriveType,
        student_recruitment_count: refreshedStudentRecruitmentCount.recruitment_count
      };

      await cacheManager.setCachedData(cacheKey, refreshedData);
      console.log(`Cache refreshed for key ${cacheKey}`);
    });

    res.json(cachedData);
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
