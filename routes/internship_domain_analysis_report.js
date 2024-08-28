const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../db_config');
const dbConfig_write = require('../read_replica_config');
const pool = new Pool(dbConfig);
const pool1 = new Pool(dbConfig_write);
const cacheManager = require('../utlis/cacheManager');
const isAuthenticated = require('../jwtAuth.js');


router.get('/internship_id/:id', isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	const college_id = req.user.college;

	if (!college_id) {
		return res.status(400).json({
			error: 'College ID not found in session.'
		});
	}

	try {
		const cacheKey = `internship_details_${college_id}_${domainId}`;
		const cachedData = await cacheManager.getCachedData(cacheKey);
  
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

		const query = `
       SELECT internship_id from report.internship_domain 
       WHERE id = $1
      `;
		const result = await pool.query(query, [domainId]);

		if (result.rows.length === 0) {
			return res.status(404).send('Internship not found');
		}

		const phase = result.rows[0];
    await cacheManager.setCachedData(cacheKey, phase); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool.query(query, [domainId]);
        if (refreshedData.rows.length > 0) {
          const phase = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, phase);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });
		res.status(200).json(phase);
	} catch (error) {
		console.error('Error fetching phase details:', error);
		res.status(500).send('Internal Server Error');
	}
});


router.get('/domain_details/:id', isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	const college_id = req.user.college;

	if (!college_id) {
		return res.status(400).json({
			error: 'College code not found in session.'
		});
	}

	try {
		const cacheKey = `domain_details_${college_id}_${domainId}`;
		const cachedData = await cacheManager.getCachedData(cacheKey);

		if (cachedData) {
			return res.status(200).json(cachedData);
		}

		const query = `
			SELECT title
			FROM report.internship_domain
			WHERE id = $1
		`;
		const result = await pool.query(query, [domainId]);

		if (result.rows.length === 0) {
			return res.status(404).send('Phase not found');
		}

		const phase = result.rows[0];
		await cacheManager.setCachedData(cacheKey, phase); // Cache data in DynamoDB

		// Schedule automatic cache refresh
		cacheManager.scheduleCacheRefresh(cacheKey, async () => {
			const refreshedData = await pool.query(query, [domainId]);
			if (refreshedData.rows.length > 0) {
				const phase = refreshedData.rows[0];
				await cacheManager.setCachedData(cacheKey, phase);
				console.log(`Cache refreshed for key ${cacheKey}`);
			}
		});
		res.status(200).json(phase);
	} catch (error) {
		console.error('Error fetching phase details:', error);
		res.status(500).send('Internal Server Error');
	}
});



router.get('/live_session_count/:id', async (req, res) => {
  const domainId = req.params.id;

  const query = `
      SELECT
          ils.domain_id,
          COUNT(ils.event_id) AS live_session_count
      FROM
          report.internship_live_sessions ils
      WHERE
          ils.domain_id = $1
      GROUP BY
          ils.domain_id;
  `;

  try {
      const result = await pool.query(query, [domainId]);
      if (result.rows.length > 0) {
          res.json(result.rows[0]); // Send the first row as JSON
      } else {
          res.json({ live_session_count: 0 }); // Handle case where no rows are returned
      }
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Server error');
  }
});

router.get('/live_sessions_topdata/:id', isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	const college_id = req.user.college;
	if (!college_id) {
		return res.status(400).json({
			error: 'College code not found in session.'
		});
	}

	try {
		const cacheKey = `live_sessions_topdata_${domainId}_${college_id}`;
		const cachedData = await cacheManager.getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

		const query = `
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
    WHERE c.id = $3
    GROUP BY ils.event_id
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
        INNER JOIN report.batch_data bd on sr.registration_number = bd.regno and ib.batch_id = bd.batch_id
        INNER JOIN college c on bd.college_id = c.id
    WHERE c.id = $4
    GROUP BY ils.event_id
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
        ), 2) AS average_feedback,
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
        INNER JOIN report.batch_data bd on sr.registration_number = bd.regno and ib.batch_id = bd.batch_id
        INNER JOIN college c on bd.college_id = c.id
    WHERE c.id = $2
    GROUP BY sr.event_id
)
SELECT
    COUNT(DISTINCT ts.event_id) AS number_of_sessions,
    SUM(ts.total_students) AS total_students_domain,
    SUM(COALESCE(ea.present_students, 0)) AS present_students_domain,
    SUM(ts.total_students) - SUM(COALESCE(ea.present_students, 0)) AS absent_students_domain,
    SUM(e.num_hours) AS total_hours_covered,
    ROUND(SUM(COALESCE(ea.present_students, 0)) * 100.0 / SUM(ts.total_students), 2) AS overall_attendance_rate,
    ROUND(AVG(ef.average_feedback), 2) AS overall_average_feedback,
    ROUND(AVG(ef.avg_interactiveness_percentage), 2) AS overall_avg_interactiveness_percentage
FROM
    TotalStudents ts
    LEFT JOIN EventAttendance ea ON ts.event_id = ea.event_id
    LEFT JOIN report.events e ON ts.event_id = e.id
    LEFT JOIN EventFeedback ef ON ts.event_id = ef.event_id
WHERE
    ts.event_id IN (
        SELECT event_id
        FROM report.internship_live_sessions
        WHERE domain_id = $1
    );
      `;

		const result = await pool1.query(query, [domainId, college_id, college_id, college_id]);

		if (result.rows.length === 0) {
			return res.status(404).send('Live sessions not found');
		}

		const domain = result.rows[0];
		await cacheManager.setCachedData(cacheKey, domain); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool1.query(query, [domainId, college_id, college_id, college_id]);
        if (refreshedData.rows.length > 0) {
          const domain = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, domain);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      }); // Cache data in DynamoDB
		res.status(200).json(domain);
	} catch (error) {
		console.error('Error fetching live session details:', error);
		res.status(500).send('Internal Server Error');
	}
});

router.get('/assessment_graph_details/:id', isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	const college_id = req.user.college;

	if (!college_id) {
		return res.status(400).json({
			error: 'College code not found in session.'
		});
	}

	try {
		const cacheKey = `assessment_graph_details_${domainId}`;
		const cachedData = await cacheManager.getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

		const query = `
        SELECT COUNT(ia.assessment_id) AS assessment_count,
               SUM(CASE WHEN h.test_type_id = 13 THEN 1 ELSE 0 END) AS daily_tests,
               SUM(CASE WHEN h.test_type_id = 81 THEN 1 ELSE 0 END) AS grand_tests,
               SUM(CASE WHEN h.test_type_id = 80 THEN 1 ELSE 0 END) AS assignments
        FROM report.internship_domain id
        INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
        INNER JOIN hackathon h ON ia.assessment_id = h.id
        WHERE id.id = $1
      `;
		const result = await pool1.query(query, [domainId]);

		if (result.rows.length === 0) {
			return res.status(404).send('Assessments not found');
		}

		const assessmentData = result.rows[0];
		await cacheManager.setCachedData(cacheKey, assessmentData); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool1.query(query, [domainId]);
        if (refreshedData.rows.length > 0) {
          const assessmentData = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, assessmentData);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });
		res.status(200).json(assessmentData);
	} catch (error) {
		console.error('Error fetching assessments details:', error);
		res.status(500).send('Internal Server Error');
	}
});


router.get('/employability_graph_details/:id', isAuthenticated,async (req, res) => {
	const domainId = req.params.id;

	try {
    /*
		const cacheKey = `employability_graph_details_${domainId}`;
		const cachedData = await cacheManager.getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      */

		const query = `
       SELECT
  h.id,
  h.title,
  AVG(uhp.current_score * 100 / hw.score) AS average_100_equivalent_score,
  COUNT(u.id) AS students_attempted
FROM
  report.internship_assessment ia
INNER JOIN report.internship_domain id ON ia.domain_id = id.id
INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
INNER JOIN report.batch_data bd_ib ON ib.batch_id = bd_ib.batch_id -- Alias added to distinguish from the next join
INNER JOIN "user" u ON bd_ib.email = u.email
INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id AND ia.assessment_id = uhp.hackathon_id
INNER JOIN hackathon h ON uhp.hackathon_id = h.id
INNER JOIN report.batch_data bd_u ON u.email = bd_u.email -- Alias added to distinguish from the previous join
INNER JOIN college c ON bd_u.college_id = c.id AND u.college_id = c.id
INNER JOIN hackathon_with_score hw ON h.id = hw.id
WHERE
  id.id = $1
  AND h.test_type_id IN (6,54, 12)
GROUP BY
  h.id, h.title;
      `;
		const result = await pool1.query(query, [domainId]);

		if (result.rows.length === 0) {
			return res.status(404).send('Employability graph details not found');
		}

		const employabilityData = result.rows;
    /*
		await cacheManager.setCachedData(cacheKey, employabilityData); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool1.query(query, [domainId]);
        if (refreshedData.rows.length > 0) {
          const employabilityData = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, employabilityData);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });
      */
		res.status(200).json(employabilityData);
	} catch (error) {
		console.error('Error fetching employability graph details:', error);
		res.status(500).send('Internal Server Error');
	}
});



router.get('/enrolled_students/:id', isAuthenticated, async (req, res) => {
  const domainId = req.params.id;
  const collegeId = req.user.college || null;

  if (!collegeId) {
    return res.status(400).json({
      error: 'College code not found in session.'
    });
  }

  try {
    /*
    const cacheKey = `enrolled_students_${domainId}_${collegeId}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    */

    const query = `
      SELECT
        u.image,
        bd.email,
        bd.name,
        ROUND(pro.total_score, 2) as emp_score,
        pro.employability_band,
        id.title,
        id.start_date
      FROM
        report.batch_data bd
      INNER JOIN
        report.internship_batch ib ON bd.batch_id = ib.batch_id
      INNER JOIN
        report.internship_domain id ON ib.domain_id = id.id
      LEFT JOIN
        "user" u on bd.email = u.email
      LEFT JOIN
        report.profiling_report_overall pro on u.id = pro.user_id
      INNER JOIN
        college c on bd.college_id = c.id
      WHERE id.id = $1 and c.id = $2
    `;
    const result = await pool1.query(query, [domainId, collegeId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Enrolled Students not found');
    }

    const enrolledStudents = result.rows;
    /*
    // Cache the retrieved data
    await cacheManager.setCachedData(cacheKey, enrolledStudents);

    // Schedule automatic cache refresh
    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      try {
        const refreshedResult = await pool1.query(query, [domainId, collegeId]);
        if (refreshedResult.rows.length > 0) {
          const refreshedEnrolledStudents = refreshedResult.rows;
          await cacheManager.setCachedData(cacheKey, refreshedEnrolledStudents);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      } catch (refreshError) {
        console.error(`Error refreshing cache for key ${cacheKey}:`, refreshError);
      }
    });
    */

    res.status(200).json(enrolledStudents);
  } catch (error) {
    console.error('Error fetching enrolled student details:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/daily_test/:id', isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	try {
		const college_id = req.user.college || null;
		/*
		const cacheKey = `daily_test_${domainId}_${college_id}`;

		const cachedData = await cacheManager.getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
		*/

		const query = `
        SELECT
          bd.name,
          bd.email,
          bd.regno,
          ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
          jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores
        FROM
          report.internship_domain id
          INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
          INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
          INNER JOIN report.batch b ON ib.batch_id = b.id
          INNER JOIN report.batch_data bd ON b.id = bd.batch_id
          INNER JOIN "user" u ON bd.email = u.email
          INNER JOIN college c ON u.college_id = c.id
          INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
          INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND ia.assessment_id = h.id
          LEFT JOIN hackathon_with_score hw ON h.id = hw.id
        WHERE
          id.id = $1
          AND h.test_type_id = 13
          AND c.id = $2
        GROUP BY
          bd.name,
          bd.email,
          bd.regno
          ORDER BY test_score DESC

      `;
		const result = await pool1.query(query, [domainId, college_id]);

		if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Daily Test Details not found' });
    }

		const data = result.rows;
		/*
		await cacheManager.setCachedData(cacheKey, data); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool1.query(query, [domainId, college_id]);
        if (refreshedData.rows.length > 0) {
          const data = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, data);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });
      */
		res.json(data);
	} catch (error) {
		console.error('Error fetching daily test details:', error);
		res.status(500).send('Internal Server Error');
	}
});

router.get('/grand_test/:id',isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	try {
		const college_id = req.user.college || null;
		/*
		const cacheKey = `grand_test_${domainId}_${college_id}`;

		const cachedData = await cacheManager.getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      */

		const query = `
        SELECT
          bd.name,
          bd.email,
          bd.regno,
          ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
          jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores
        FROM
          report.internship_domain id
          INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
          INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
          INNER JOIN report.batch b ON ib.batch_id = b.id
          INNER JOIN report.batch_data bd ON b.id = bd.batch_id
          INNER JOIN "user" u ON bd.email = u.email
          INNER JOIN college c ON u.college_id = c.id
          INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
          INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND ia.assessment_id = h.id
          LEFT JOIN hackathon_with_score hw ON h.id = hw.id
        WHERE
          id.id = $1
          AND h.test_type_id = 81
          AND c.id = $2
        GROUP BY
          bd.name,
          bd.email,
          bd.regno
          ORDER BY test_score DESC
      `;
		const result = await pool1.query(query, [domainId, college_id]);

		if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Grand Test Details not found' });
    }

		const data = result.rows;
		/*
		await cacheManager.setCachedData(cacheKey, data); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool1.query(query, [domainId, college_id]);
        if (refreshedData.rows.length > 0) {
          const data = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, data);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });
      */
		res.json(data);
	} catch (error) {
		console.error('Error fetching grand test details:', error);
		res.status(500).send('Internal Server Error');
	}
});



router.get('/employability_students_data/:id', isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	try {
		const query = `
        SELECT
          bd.name,
          bd.email,
          bd.regno,
          ROUND(AVG((uhp.current_score * 100.0) / hw.score), 2) AS test_score,
          jsonb_object_agg(h.title::text, ROUND((uhp.current_score * 100.0) / hw.score)) AS hackathon_scores 
        FROM
          report.internship_domain id
          INNER JOIN report.internship_assessment ia ON id.id = ia.domain_id
          INNER JOIN report.internship_batch ib ON id.id = ib.domain_id
          INNER JOIN report.batch b ON ib.batch_id = b.id
          INNER JOIN report.batch_data bd ON b.id = bd.batch_id
          INNER JOIN "user" u ON bd.email = u.email
          INNER JOIN college c ON u.college_id = c.id
          INNER JOIN user_hackathon_participation uhp ON u.id = uhp.user_id
          INNER JOIN hackathon h ON uhp.hackathon_id = h.id AND ia.assessment_id = h.id
          LEFT JOIN hackathon_with_score hw ON h.id = hw.id
        WHERE
          id.id = $1
          AND h.test_type_id in (6,54,12)
        GROUP BY
          bd.name,
          bd.email,
          bd.regno 
          ORDER BY 
          test_score DESC

      `;
		const result = await pool1.query(query, [domainId]);

		if (result.rows.length === 0) {
			return res.status(404).send('Employability Students Data not found');
		}

		const data = result.rows;
		
		res.json(data);
	} catch (error) {
		console.error('Error fetching employability students data:', error);
		res.status(500).send('Internal Server Error');
	}
});

router.get('/data/:id', isAuthenticated, async (req, res) => {
	try {
		const college_id = req.user.college || null;
		const domainId = req.params.id;

    /*

		const cacheKey = `data_${domainId}_${college_id}`;
		const cachedData = await cacheManager.getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
*/
		const eventsQuery = `
        SELECT event_title
        FROM report.events e
        INNER JOIN report.internship_live_sessions pl ON e.id = pl.event_id
        WHERE pl.domain_id = $1;
      `;
		const eventsResult = await pool1.query(eventsQuery, [domainId]);

		if (!eventsResult.rows || eventsResult.rows.length === 0) {
			return res.status(500).json({
				error: 'An error occurred fetching events.'
			});
		}

		const allEvents = eventsResult.rows.map(row => row.event_title);

		const sql = `
        WITH DistinctEvents AS (
          SELECT
            sr.registration_number,
            c.code AS college_code,
            json_agg(DISTINCT e.event_title) AS events,
            bd.name,
            bd.email,
            bd.phone
          FROM
            report.batch_data bd
            INNER JOIN report.student_responses sr ON lower(bd.regno) = lower(sr.registration_number)
            INNER JOIN report.internship_batch ib ON bd.batch_id = ib.batch_id
            INNER JOIN report.internship_domain id ON ib.domain_id = id.id
            INNER JOIN college c ON bd.college_id = c.id
            INNER JOIN report.events e ON sr.event_id = e.id
            INNER JOIN report.internship_live_sessions ils ON ils.event_id = e.id
          WHERE
            id.id = $1 AND c.id = $2
          GROUP BY
            sr.registration_number, c.code, bd.name, bd.email, bd.phone
          HAVING
            json_agg(DISTINCT e.event_title) IS NOT NULL  -- Ensure the events array is not empty
        )
        SELECT
          registration_number,
          name,
          email,
          phone,
          events
        FROM
          DistinctEvents;
      `;

		const result = await pool1.query(sql, [domainId, college_id]);

		if (!result.rows || result.rows.length === 0) {
			return res.status(500).json({
				error: 'An error occurred fetching user events.'
			});
		}

		const data = result.rows.map(row => {
			const userEvents = row.events || [];
			const rowData = {
				'Registration Number': row.registration_number,
				'Name': row.name,
				'Email': row.email,
				'Phone': row.phone,
			};

			allEvents.forEach(event => {
				rowData[event] = userEvents.includes(event) ? '✔' : '❌';
			});

			return rowData;
		});
    
    /*

		await cacheManager.setCachedData(cacheKey, data); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool1.query(sql, [domainId, college_id]);
        if (refreshedData.rows.length > 0) {
          const data = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, data);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });

      */

		res.json(data);
	} catch (error) {
		console.error('Error querying database:', error);
		res.status(500).json({
			error: 'Internal Server Error',
			message: error.message
		});
	}
});



router.get('/attendance_count/:id', isAuthenticated, async (req, res) => {
	const domainId = req.params.id;
	try {
		const college_id = req.user.college || null;
		const cacheKey = `attendance_${domainId}_${college_id}`;

		// Attempt to fetch cached data
		const cachedData = await cacheManager.getCachedData(cacheKey);
  
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

		// If cached data doesn't exist, fetch from the database
		const query = `
        SELECT
          e.event_title,
          count(sr.event_id)
        FROM
          report.batch_data bd
          INNER JOIN report.student_responses sr ON lower(bd.regno) = lower(sr.registration_number)
          INNER JOIN report.internship_batch ib ON bd.batch_id = ib.batch_id
          INNER JOIN report.internship_domain id ON ib.domain_id = id.id
          INNER JOIN college c ON bd.college_id = c.id
          INNER JOIN report.events e ON sr.event_id = e.id
          INNER JOIN report.internship_live_sessions ils ON e.id = ils.event_id
        WHERE
          id.id = $1 and c.id = $2
        GROUP BY
          e.event_title
      `;

		const result = await pool1.query(query, [domainId, college_id]);

		if (result.rows.length === 0) {
			return res.status(404).send({
				message: 'Attendance Data not found'
			});
		}

		const attendanceData = result.rows.map((row) => ({
			event_title: row.event_title,
			count: row.count,
		}));

		await cacheManager.setCachedData(cacheKey, attendanceData); // Cache data in DynamoDB

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
        const refreshedData = await pool1.query(query, [domainId, college_id]);
        if (refreshedData.rows.length > 0) {
          const attendanceData = refreshedData.rows[0];
          await cacheManager.setCachedData(cacheKey, attendanceData);
          console.log(`Cache refreshed for key ${cacheKey}`);
        }
      });

		res.json(attendanceData);
	} catch (error) {
		console.error('Error fetching Attendance Data:', error);
		res.status(500).send({
			message: 'Internal Server Error'
		});
	}
});


router.get('/project_details/:domain_id', isAuthenticated, async (req, res) => {
  const domainId = req.params.domain_id;
  const college_id = req.user.college;

  if (!college_id) {
      return res.status(400).json({
          error: 'College code not found in session.'
      });
  }

  try {
      const query = `
          SELECT
              bd.name as name,
              bd.email,
              bd.regno,
              c.name as college_name,
              ptt.title
          FROM
              report.batch_data bd
          INNER JOIN
              report.college c ON bd.college_id = c.id
          INNER JOIN
              report.internship_batch ib ON bd.batch_id = ib.batch_id
          INNER JOIN
              report.internship_domain id ON ib.domain_id = id.id
          INNER JOIN
              report.project_teams pt ON bd.regno = pt.team_lead and id.id = pt.domain_id
          INNER JOIN
              report.project_titles ptt ON id.id = ptt.domain_id and pt.project_id = ptt.id
          WHERE
              id.id = $1 AND c.id = $2
      `;

      const result = await pool.query(query, [domainId, college_id]);

      if (result.rows.length === 0) {
          console.log(`No batch data found for domainId: ${domainId}`);
          return res.status(404).send('No batch data found for the specified domain');
      }

      const batchDataDetails = result.rows;
      console.log(`Fetched data from database for domainId: ${domainId}`, batchDataDetails);

      res.status(200).json(batchDataDetails);
  } catch (error) {
      console.error('Error fetching batch data details:', error);
      res.status(500).send('Internal Server Error');
  }
});




router.get('/project_title_count/:domain_id', isAuthenticated, async (req, res) => {
  const domainId = req.params.domain_id;
  const college_id = req.user.college;

  if (!college_id) {
      return res.status(400).json({
          error: 'College code not found in session.'
      });
  }

  try {
      const cacheKey = `project_title_count_${college_id}_${domainId}`;
      const cachedData = await cacheManager.getCachedData(cacheKey);

      if (cachedData) {
          console.log(`Cache hit for key ${cacheKey}`);
          return res.status(200).json(cachedData);
      }

      console.log(`Cache miss for key ${cacheKey}. Fetching from database.`);

      const query = `
          SELECT COUNT(title) AS title_count
          FROM report.project_titles
          WHERE domain_id = $1
      `;
      const result = await pool.query(query, [domainId]);

      if (result.rows.length === 0) {
          console.log(`No project titles found for domainId: ${domainId}`);
          return res.status(404).send('No project titles found for the specified domain');
      }

      const titleCount = result.rows[0];
      console.log(`Fetched data from database for domainId: ${domainId}`, titleCount);

      await cacheManager.setCachedData(cacheKey, titleCount); // Cache data

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
          console.log(`Refreshing cache for key ${cacheKey}`);
          const refreshedData = await pool.query(query, [domainId]);
          if (refreshedData.rows.length > 0) {
              await cacheManager.setCachedData(cacheKey, refreshedData.rows[0]);
              console.log(`Cache refreshed for key ${cacheKey}`);
          } else {
              console.log(`No data found during cache refresh for key ${cacheKey}`);
          }
      });

      res.status(200).json(titleCount);
  } catch (error) {
      console.error('Error fetching project title count:', error);
      res.status(500).send('Internal Server Error');
  }
});



module.exports = router;
