const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { Pool } = require('pg');
const dbConfig = require('../read_replica_config.js');
const cacheManager = require('../utlis/cacheManager.js') // Ensure this path is correct
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');

router.get('/main_cards',isAuthenticated, async (req, res) => {
  try {
    const collegeId = req.user.college || null;

    if (!collegeId) {
      return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    const cacheKey = `main_cards-${collegeId}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Initialize variables with default values
    let totalParticipants = 0;
    let totalParticipantsCount = 0;
    let top100Count = 0;
    let totalCollegeCodes = 0;
    let collegeRank = "Not available";
    let zeroScorers = 0;
    let avgEmpScore = 0;

    // Fetch total number of participants in the specific college
    const sqlTotalParticipants = `
      SELECT COUNT(*) AS total 
      FROM report.profiling_scores1
      INNER JOIN "user" u ON profiling_scores1.user_id = u.id
      INNER JOIN college c ON u.college_id = c.id
      WHERE c.id = $1
    `;
    const resultTotalParticipants = await pool.query(sqlTotalParticipants, [collegeId]);
    if (resultTotalParticipants.rows.length > 0) {
      totalParticipants = parseInt(resultTotalParticipants.rows[0].total, 10);
    }

    // Fetch total number of participants across all colleges
    const sqlTotalParticipantsAll = `
      SELECT COUNT(*) AS total_participants 
      FROM report.profiling_scores1
    `;
    const resultTotalParticipantsAll = await pool.query(sqlTotalParticipantsAll);
    if (resultTotalParticipantsAll.rows.length > 0) {
      totalParticipantsCount = parseInt(resultTotalParticipantsAll.rows[0].total_participants, 10);
    }

    // Fetch count of top 100 students in the specific college
    const sqlTop100Students = `
      WITH rc AS (
        SELECT user_id, profiling_scores1.total_score, c.id
        FROM report.profiling_scores1
        INNER JOIN "user" u ON profiling_scores1.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        ORDER BY profiling_scores1.total_score DESC
        LIMIT 100
      )
      SELECT COUNT(*) AS top_100_count
      FROM rc
      WHERE id = $1
    `;
    const resultTop100Students = await pool.query(sqlTop100Students, [collegeId]);
    if (resultTop100Students.rows.length > 0) {
      top100Count = parseInt(resultTop100Students.rows[0].top_100_count, 10);
    }

    // Fetch total count of unique college codes
    const sqlTotalCollegeCodes = `
      SELECT COUNT(DISTINCT c.id) AS total
      FROM report.profiling_scores1
      INNER JOIN "user" u ON profiling_scores1.user_id = u.id
      INNER JOIN college c ON u.college_id = c.id
    `;
    const resultTotalCollegeCodes = await pool.query(sqlTotalCollegeCodes);
    if (resultTotalCollegeCodes.rows.length > 0) {
      totalCollegeCodes = parseInt(resultTotalCollegeCodes.rows[0].total, 10);
    }

    // Fetch college rank for the specific college
    const sqlFetchRank = `
      SELECT rank 
      FROM report.profiling_rankings 
      WHERE college_id = $1
    `;
    const resultFetchRank = await pool.query(sqlFetchRank, [collegeId]);
    if (resultFetchRank.rows.length > 0) {
      collegeRank = resultFetchRank.rows[0].rank;
    }

    // Fetch average employability score and zero scorers
    const sqlZeroScores = `
      WITH reports AS (
        SELECT round(avg(total_score), 2) AS average_employability_score
        FROM report.profiling_scores1
        INNER JOIN "user" u ON profiling_scores1.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        WHERE c.id = $1
      ),
      rs AS (
        SELECT COUNT(*) AS zero_scorers
        FROM report.profiling_scores1
        INNER JOIN "user" u ON profiling_scores1.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        WHERE c.id = $1 AND total_score = 0
      )
      SELECT
        reports.average_employability_score,
        rs.zero_scorers
      FROM reports, rs;
    `;
    const resultZeroScores = await pool.query(sqlZeroScores, [collegeId]);
    if (resultZeroScores.rows.length > 0) {
      zeroScorers = parseInt(resultZeroScores.rows[0].zero_scorers, 10);
      avgEmpScore = parseFloat(resultZeroScores.rows[0].average_employability_score);
    }

    // Prepare the response data
    const responseData = {
      college_code: collegeId,
      total_participants: totalParticipants,
      total_participants_all: totalParticipantsCount,
      top_100_count: top100Count,
      total_college_codes: totalCollegeCodes,
      college_rank: collegeRank,
      zero_scorers: zeroScorers,
      avg_emp_score: avgEmpScore
    };

    // Cache the data in DynamoDB
    await cacheManager.setCachedData(cacheKey, responseData);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      try {
        const refreshedData = {
          college_code: collegeId,
          total_participants: (await pool.query(sqlTotalParticipants, [collegeId])).rows[0]?.total || 0,
          total_participants_all: (await pool.query(sqlTotalParticipantsAll)).rows[0]?.total_participants || 0,
          top_100_count: (await pool.query(sqlTop100Students, [collegeId])).rows[0]?.top_100_count || 0,
          total_college_codes: (await pool.query(sqlTotalCollegeCodes)).rows[0]?.total || 0,
          college_rank: (await pool.query(sqlFetchRank, [collegeId])).rows[0]?.rank || "Not available",
          zero_scorers: (await pool.query(sqlZeroScores, [collegeId])).rows[0]?.zero_scorers || 0,
          avg_emp_score: (await pool.query(sqlZeroScores, [collegeId])).rows[0]?.average_employability_score || 0
        };
        await cacheManager.setCachedData(cacheKey, refreshedData);
        console.log(`Cache refreshed for key ${cacheKey}`);
      } catch (refreshError) {
        console.error('Error refreshing cache:', refreshError);
      }
    });

    // Send the response
    res.json(responseData);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
