const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const xlsx = require('node-xlsx').default;
const AWS = require('aws-sdk');
const dbConfig = require('../db_config');
const dbConfigWrite = require('../read_replica_config');
const cacheManager = require('../utlis/cacheManager');
const isAuthenticated = require('../jwtAuth.js');


router.get('/overview/:domainId', isAuthenticated, async (req, res) => {
  const domainId = req.params.domainId;
  const college_id = req.user.college;

  try {
    if (!college_id) {
      return res.status(400).json({ error: 'College code not found in session.' });
    }

    const cacheKey = `overview_${college_id}_${domainId}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const overviewQuery = `
      WITH TotalStudents AS (
        SELECT
          ia.assessment_id,
          COUNT(DISTINCT bd.regno) AS total_students
        FROM
          report.internship_domain id
          INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
          INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
          INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
          INNER JOIN college c ON bd.college_id = c.id
        WHERE
          c.id = $1 and ib.domain_id = $2
        GROUP BY
          ia.assessment_id
      ),
      AssessmentAttendance AS (
        SELECT
          ia.assessment_id,
          COUNT(DISTINCT uhp.user_id) AS present_students,
          ROUND(AVG(uhp.current_score * 100.0 / hw.score), 2) AS average_100_equivalent_score
        FROM
          user_hackathon_participation uhp
          INNER JOIN report.internship_assessment ia ON uhp.hackathon_id = ia.assessment_id
          INNER JOIN report.internship_domain id ON ia.domain_id = id.id
          INNER JOIN "user" u ON uhp.user_id = u.id
          INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
          INNER JOIN report.batch_data bd ON u.email = bd.email AND ib.batch_id = bd.batch_id
          INNER JOIN hackathon_with_score hw ON uhp.hackathon_id = hw.id
          INNER JOIN college c ON u.college_id = c.id AND bd.college_id = c.id
        WHERE
          c.id = $3 and id.id = $4 -- College filter applied here
        GROUP BY
          ia.assessment_id
      )
      SELECT
        h.id,
        h.title,
        ts.total_students,
        COALESCE(aa.present_students, 0) AS present_students,
        ts.total_students - COALESCE(aa.present_students, 0) AS absent_students,
        ROUND(COALESCE(aa.present_students, 0) * 100.0 / ts.total_students, 2) AS attendance_rate,
        aa.average_100_equivalent_score
      FROM
        TotalStudents ts
        LEFT JOIN AssessmentAttendance aa ON ts.assessment_id = aa.assessment_id
      INNER JOIN report.internship_assessment ia ON ts.assessment_id = ia.assessment_id
        INNER JOIN hackathon h ON ts.assessment_id = h.id and ia.assessment_id = h.id
      WHERE
        ia.domain_id = $5;`;

    const pool = new Pool(dbConfigWrite);
    const { rows } = await pool.query(overviewQuery, [college_id, domainId, college_id, domainId, domainId]);

    await cacheManager.setCachedData(cacheKey, rows); // Cache data in DynamoDB

    // Schedule automatic cache refresh (assuming this functionality exists in cacheManager)
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      const refreshedResult = await pool.query(overviewQuery, [college_id, domainId, college_id, domainId, domainId]);
      if (refreshedResult.rows.length > 0) {
        await cacheManager.setCachedData(cacheKey, refreshedResult.rows);
        console.log(`Cache refreshed for key ${cacheKey}`);
      }
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching overview:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

router.get('/download-absentees/:assessmentId', isAuthenticated, async (req, res) => {
  const assessmentId = req.params.assessmentId;
  const college_id = req.user.college;

  try {
    if (!college_id) {
      return res.status(400).json({ error: 'College code not found in session.' });
    }

    const cacheKey = `absentees_${college_id}_${assessmentId}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      // Directly send the cached Excel buffer
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="absentees_event_${assessmentId}.xlsx"`
      );
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.status(200).send(cachedData);
    }

    const absenteesQuery = `
      WITH TotalStudents AS (
        SELECT
          ia.assessment_id,
          bd.regno,
          bd.name,
          bd.phone,
          bd.email
        FROM
          report.internship_domain id
          INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
          INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
          INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
          INNER JOIN college c ON bd.college_id = c.id
        WHERE
          c.id = $1
      ),
      AssessmentsAttendance AS (
        SELECT
          uhp.hackathon_id AS assessment_id,
          bd.email
        FROM
          user_hackathon_participation uhp
          INNER JOIN report.internship_assessment ia ON uhp.hackathon_id = ia.assessment_id
          INNER JOIN "user" u ON uhp.user_id = u.id
          INNER JOIN report.internship_domain id ON ia.domain_id = id.id
          INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
          INNER JOIN report.batch_data bd ON u.email = bd.email AND ib.batch_id = bd.batch_id
          INNER JOIN college c ON u.college_id = c.id AND bd.college_id = c.id
        WHERE
          c.id = $2
      ),
      AbsentStudents AS (
        SELECT
          ts.email,
          ts.assessment_id,
          ts.regno,
          ts.name,
          ts.phone
        FROM
          TotalStudents ts
          LEFT JOIN AssessmentsAttendance aa ON ts.assessment_id = aa.assessment_id AND ts.email = aa.email
        WHERE
          aa.email IS NULL
      )
      SELECT
        asb.name,
        asb.phone,
        asb.email,
        asb.regno
      FROM
        AbsentStudents asb
      WHERE
        asb.assessment_id = $3
      ORDER BY
        asb.name;`;

    const pool = new Pool(dbConfigWrite);
    const { rows } = await pool.query(absenteesQuery, [college_id, college_id, assessmentId]);

    const data = [
      ['Name', 'Phone', 'Email', 'Absent Student ID'],
      ...rows.map(row => [row.name, row.phone, row.email, row.regno])
    ];

    const buffer = xlsx.build([{ name: 'Absentees', data }]);
    await cacheManager.setCachedData(cacheKey, buffer); // Cache Excel buffer in DynamoDB

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="absentees_event_${assessmentId}.xlsx"`
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error fetching absentees:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

module.exports = router;