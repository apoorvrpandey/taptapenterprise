// server.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);
const xlsx = require('node-xlsx').default;
const isAuthenticated = require('../jwtAuth.js');

router.get('/overview/:domainId', isAuthenticated, async (req, res) => {
    const domainId = req.params.domainId;
    const college_id = req.user.college;
        
        if (!college_id) {
            return res.status(400).json({ error: 'College code not found in session.' });
        }
    try {
        const overviewQuery = `
            WITH TotalStudents AS (
               SELECT
                   ils.event_id,
                   COUNT(DISTINCT bd.regno) AS total_students
               FROM
                   report.internship_domain id
                   LEFT JOIN report.internship_batch ib ON id.id = ib.domain_id
                   LEFT JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
                   LEFT JOIN report.internship_live_sessions ils ON id.id = ils.domain_id
                   LEFT JOIN college c on bd.college_id = c.id
               where c.id = $4
               GROUP BY
                   ils.event_id
           ),
           EventAttendance AS (
               SELECT
                   ils.event_id,
                   COUNT(DISTINCT sr.registration_number) AS present_students
               FROM
                   report.student_responses sr
                   INNER JOIN report.internship_live_sessions ils ON sr.event_id = ils.event_id
                   INNER JOIN report.internship_domain id on id.id = ils.domain_id
                   INNER JOIN report.internship_batch ib on id.id = ib.domain_id
                   INNER JOIN report.batch_data bd on lower(sr.registration_number) = lower(bd.regno) and ib.batch_id = bd.batch_id
                   INNER JOIN college c on bd.college_id = c.id
               where c.id = $3
               GROUP BY
                   ils.event_id
           ),
           EventFeedback AS (
               SELECT
                   sr.event_id,
                   ROUND(AVG(
                       CASE sr.feedback
                           WHEN 'Extremely Satisfied' THEN 5
                           WHEN 'Very Satisfied' THEN 4
                           WHEN 'Satisfied' THEN 3
                           WHEN 'Slightly Satisfied' THEN 2
                           WHEN 'Needs Improvement' THEN 1
                           ELSE 0
                       END
                   ),2 )AS average_feedback,
                   ROUND(
                       AVG(
                           CASE sr.interactive
                               WHEN 'Yes' THEN 1
                               ELSE 0
                           END
                       ) * 100, 2
                   ) AS avg_interactiveness_percentage
               FROM
                   report.student_responses sr
               INNER JOIN report.internship_live_sessions ils ON sr.event_id = ils.event_id
                   INNER JOIN report.internship_domain id on id.id = ils.domain_id
                   INNER JOIN report.internship_batch ib on id.id = ib.domain_id
                   INNER JOIN report.batch_data bd on lower(sr.registration_number) = lower(bd.regno) and ib.batch_id = bd.batch_id
                   INNER JOIN college c on bd.college_id = c.id
               where c.id = $2
               GROUP BY
                   sr.event_id
           )
           SELECT
               e.id,
               e.event_title,
               ts.total_students,
               COALESCE(ea.present_students, 0) AS present_students,
               ts.total_students - COALESCE(ea.present_students, 0) AS absent_students,
               e.num_hours AS hours_covered,
               ROUND(COALESCE(ea.present_students, 0) * 100.0 / ts.total_students) AS attendance_rate,
               ef.average_feedback,
               ef.avg_interactiveness_percentage
           FROM
               TotalStudents ts
               LEFT JOIN EventAttendance ea ON ts.event_id = ea.event_id
               INNER JOIN report.events e ON ts.event_id = e.id
               LEFT JOIN EventFeedback ef ON ts.event_id = ef.event_id
           WHERE
               ts.event_id IN (
                   SELECT event_id
                   FROM report.internship_live_sessions
                   WHERE domain_id = $1
               );


        `;

        const { rows } = await pool1.query(overviewQuery, [domainId, college_id,college_id,college_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching trainings:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});



router.get('/download-absentees/:eventId',isAuthenticated, async (req, res) => {
    const eventId = req.params.eventId;
    const college_id = req.user.college;
        
        if (!college_id) {
            return res.status(400).json({ error: 'College code not found in session.' });
        }

    const absenteesQuery = `
        WITH TotalStudents AS (
           SELECT
               ils.event_id,
               bd.regno AS student_id,
               bd.name,
               bd.phone,
               bd.email
           FROM
               report.internship_domain id
               INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
               INNER JOIN report.batch_data bd ON ib.batch_id = bd.batch_id
               INNER JOIN report.internship_live_sessions ils ON id.id = ils.domain_id
               INNER JOIN college c on bd.college_id = c.id
           where c.id = $3
       ),
       EventAttendance AS (
           SELECT
               sr.event_id,
               sr.registration_number AS student_id
           FROM
               report.student_responses sr
               INNER JOIN report.internship_live_sessions ils ON sr.event_id = ils.event_id
               INNER JOIN report.internship_domain id on ils.domain_id = id.id
               INNER JOIN report.internship_batch ib on id.id = ib.domain_id
               INNER JOIN report.batch_data bd on lower(bd.regno) = lower(sr.registration_number) and ib.batch_id = bd.batch_id
               INNER JOIN college c on  bd.college_id = c.id
           where c.id = $2
       ),
       AbsentStudents AS (
           SELECT
               ts.event_id,
               ts.student_id,
               ts.name,
               ts.phone,
               ts.email
           FROM
               TotalStudents ts
               LEFT JOIN EventAttendance ea ON ts.event_id = ea.event_id AND ts.student_id = ea.student_id
           WHERE
               ea.student_id IS NULL
       )
       SELECT
           asb.name,
           asb.phone,
           asb.email,
           asb.student_id AS absent_student_id
       FROM
           AbsentStudents asb
       WHERE
           asb.event_id = $1
       ORDER BY
           asb.name;

    `;

    try {
        const result = await pool1.query(absenteesQuery, [eventId, college_id,college_id]);
        
        const data = [
            ['Name', 'Phone', 'Email', 'Absent Student ID'],
            ...result.rows.map(row => [row.name, row.phone, row.email, row.absent_student_id])
        ];
        
        const buffer = xlsx.build([{ name: 'Absentees', data }]);
        
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="absentees_event_${eventId}.xlsx"`
        );
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
