const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const { getCachedData, setCachedData, scheduleCacheRefresh } = require('../utlis/cacheManager.js');
const isAuthenticated = require('../jwtAuth.js');

const executeQuery = async (query, params) => {
  const { rows } = await pool.query(query, params);
  return rows;
};

// Route to fetch overall averages
router.get('/averages', async (req, res) => {
  const email = req.query.email;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const collegeIdQuery = `SELECT college_id FROM "user" WHERE email = $1;`;
    const collegeIdResult = await executeQuery(collegeIdQuery, [email]);

    if (collegeIdResult.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const collegeId = collegeIdResult[0].college_id;
    const cacheKey = `overall_averages_${collegeId}_${email}`;

    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('Serving from cache: /averages');
      return res.json(cachedData);
    }

    const sql = `
      SELECT
        AVG(pr1.aptitude) AS average_aptitude,
        AVG(pr1.english) AS average_english,
        AVG(pr1.coding) AS average_coding,
        AVG(pr1.total_score) AS average_score,
        COUNT(CASE WHEN pr1.employability_band = 'A' THEN 1 END) AS num_a_students,
        COUNT(CASE WHEN pr1.employability_band = 'B' THEN 1 END) AS num_b_students,
        COUNT(CASE WHEN pr1.employability_band = 'C' THEN 1 END) AS num_c_students,
        COUNT(CASE WHEN pr1.employability_band = 'D' THEN 1 END) AS num_d_students,
        COUNT(CASE WHEN pr1.employability_band = 'F' THEN 1 END) AS num_f_students,
        COUNT(pr1.employability_band) AS employability_band_sum
      FROM report.profiling_report_overall pr1
      INNER JOIN public.user u ON pr1.user_id = u.id
      INNER JOIN public.college c ON u.college_id = c.id
      WHERE c.id = $1;
    `;
    const rows = await executeQuery(sql, [collegeId]);

    if (rows && rows.length > 0) {
      const rowAverages = rows[0];
      const data = {
        email,
        college_id: collegeId,
        average_aptitude: parseFloat(rowAverages.average_aptitude).toFixed(2),
        average_english: parseFloat(rowAverages.average_english).toFixed(2),
        average_coding: parseFloat(rowAverages.average_coding).toFixed(2),
        average_score: parseFloat(rowAverages.average_score).toFixed(2),
        num_students_by_band: {
          A: rowAverages.num_a_students,
          B: rowAverages.num_b_students,
          C: rowAverages.num_c_students,
          D: rowAverages.num_d_students,
          F: rowAverages.num_f_students,
        },
        employability_band_sum: rowAverages.employability_band_sum,
      };

      await setCachedData(cacheKey, data);

      scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await executeQuery(sql, [collegeId]);
        return refreshedData[0];
      });

      return res.json(data);
    } else {
      return res.status(500).json({ error: 'No data found or an error occurred while calculating averages.' });
    }
  } catch (error) {
    console.error('Error querying database:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Route to fetch user scores
router.get('/scores', async (req, res) => {
  const email = req.query.email;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const queryUserId = 'SELECT id FROM public.user WHERE email = $1';
    const resultUserId = await executeQuery(queryUserId, [email]);

    if (resultUserId.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = resultUserId[0].id;

    const queryMetrics = `
      SELECT aptitude, english, coding, employability_band, total_score, comment, 
             aptitude_improvement_suggestions, english_improvement_suggestions,
             technical_improvement_suggestions
      FROM report.profiling_report_overall 
      WHERE user_id = $1
    `;
    const resultMetrics = await executeQuery(queryMetrics, [userId]);

    if (resultMetrics.length === 0) {
      return res.status(404).json({ error: 'User metrics not found.' });
    }

    const rowMetrics = resultMetrics[0];

    const response = {
      aptitude: parseFloat(rowMetrics.aptitude).toFixed(2),
      english: parseFloat(rowMetrics.english).toFixed(2),
      coding: parseFloat(rowMetrics.coding).toFixed(2),
      employability_band: rowMetrics.employability_band,
      total_score: parseFloat(rowMetrics.total_score).toFixed(2),
      comment: rowMetrics.comment,
      aptitude_improvement_suggestions: rowMetrics.aptitude_improvement_suggestions,
      english_improvement_suggestions: rowMetrics.english_improvement_suggestions,
      technical_improvement_suggestions: rowMetrics.technical_improvement_suggestions,
    };

    return res.json(response);
  } catch (error) {
    console.error('Error querying database:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Route to calculate score differences between user and average
router.get('/score-differences', async (req, res) => {
  const email = req.query.email;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const queryUserDetails = 'SELECT id, college_id FROM public.user WHERE email = $1';
    const resultUserDetails = await executeQuery(queryUserDetails, [email]);

    if (resultUserDetails.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = resultUserDetails[0].id;
    const collegeId = resultUserDetails[0].college_id;
    const cacheKey = `score_differences_${userId}_${collegeId}`;

    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('Serving from cache: /score-differences');
      return res.json(cachedData);
    }

    const queryAverageScores = `
      SELECT AVG(pr1.aptitude) AS average_aptitude,
             AVG(pr1.english) AS average_english,
             AVG(pr1.coding) AS average_coding,
             AVG(pr1.total_score) AS average_score
      FROM report.profiling_report_overall pr1
      INNER JOIN public.user u ON pr1.user_id = u.id
      WHERE u.college_id = $1;
    `;
    const resultAverageScores = await executeQuery(queryAverageScores, [collegeId]);

    if (resultAverageScores.length === 0) {
      return res.status(500).json({ error: 'No average scores found for the college.' });
    }

    const averageScores = resultAverageScores[0];

    const queryUserScores = `
      SELECT aptitude, english, coding, total_score
      FROM report.profiling_report_overall
      WHERE user_id = $1;
    `;
    const resultUserScores = await executeQuery(queryUserScores, [userId]);

    if (resultUserScores.length === 0) {
      return res.status(404).json({ error: 'User scores not found.' });
    }

    const userScores = resultUserScores[0];

    const scoreDifferences = {
      aptitude_difference: parseFloat(userScores.aptitude - averageScores.average_aptitude).toFixed(2),
      english_difference: parseFloat(userScores.english - averageScores.average_english).toFixed(2),
      coding_difference: parseFloat(userScores.coding - averageScores.average_coding).toFixed(2),
      total_score_difference: parseFloat(userScores.total_score - averageScores.average_score).toFixed(2),
    };

    const response = {
      user_email: email,
      user_id: userId,
      college_id: collegeId,
      score_differences: scoreDifferences,
    };

    await setCachedData(cacheKey, response);

    scheduleCacheRefresh(cacheKey, async () => {
      const refreshedAverageScores = await executeQuery(queryAverageScores, [collegeId]);
      const refreshedUserScores = await executeQuery(queryUserScores, [userId]);

      if (refreshedAverageScores.length === 0 || refreshedUserScores.length === 0) {
        throw new Error('Error refreshing cache: No data found');
      }

      const newAverageScores = refreshedAverageScores[0];
      const newUserScores = refreshedUserScores[0];

      const newScoreDifferences = {
        aptitude_difference: parseFloat(newUserScores.aptitude - newAverageScores.average_aptitude).toFixed(2),
        english_difference: parseFloat(newUserScores.english - newAverageScores.average_english).toFixed(2),
        coding_difference: parseFloat(newUserScores.coding - newAverageScores.average_coding).toFixed(2),
        total_score_difference: parseFloat(newUserScores.total_score - newAverageScores.average_score).toFixed(2),
      };

      return {
        user_email: email,
        user_id: userId,
        college_id: collegeId,
        score_differences: newScoreDifferences,
      };
    });

    return res.json(response);
  } catch (error) {
    console.error('Error querying database:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
