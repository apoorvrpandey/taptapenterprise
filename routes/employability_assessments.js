const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const cacheManager = require('../utlis/cacheManager');
const isAuthenticated = require('../jwtAuth.js');

router.get('/hackathon/:id', isAuthenticated, async (req, res) => {
  try {
    const hackathon_id = req.params.id;

    const sql = `SELECT title FROM hackathon WHERE id = $1`;
    const { rows } = await pool.query(sql, [hackathon_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});



router.get('/',isAuthenticated, async (req, res) => {
  try {
    // Check if the college code is set in the session
    const college_id = req.user.college || null;

    if (!college_id) {
      return res.status(400).json({ error: 'College code is not set in the session.' });
    }


    // SQL query to fetch the required data
    const sql = `
    SELECT h.id, h.title, count(uhp.user_id),DATE(h.start_date) AS start_date, DATE(h.end_date) AS end_date, count(rs.user_id), round(avg(rs.total_score)) as average_emp_score
FROM user_hackathon_participation uhp
INNER JOIN hackathon h ON uhp.hackathon_id = h.id
INNER JOIN report.assessments_scores rs on h.id = rs.hackathon_id
INNER JOIN "user" u ON uhp.user_id = u.id and rs.user_id = u.id
INNER JOIN college c ON u.college_id = c.id
WHERE c.id = $1 AND test_type_id IN (6, 54)
GROUP BY h.id, h.title, DATE(h.start_date), DATE(h.end_date)
ORDER BY start_date;



    `;

    // Execute the query with parameter binding
    const { rows } = await pool.query(sql, [college_id]);

    
    // Send the response
    res.json(rows);
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});


router.get('/cards/:id', isAuthenticated, async (req, res) => {
  try {
    const college_id = req.user.college;

    if (!college_id) {
      return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    const hackathon_id = req.params.id;

    

    const sql = `
     WITH college_scores AS (
        SELECT
            h.id AS hackathon_id,
            c.id AS college_id,
            COUNT(ass.user_id) AS participant_count,
            ROUND(AVG(ass.total_score)) AS test_score
        FROM
            report.assessments_scores ass
            INNER JOIN hackathon h ON ass.hackathon_id = h.id
            INNER JOIN "user" u ON ass.user_id = u.id
            INNER JOIN college c ON u.college_id = c.id
        WHERE
            h.id = $1 AND h.test_type_id IN (6, 54)
        GROUP BY
            h.id, c.id
      ),
      ranked_colleges AS (
        SELECT
            hackathon_id,
            college_id,
            participant_count,
            test_score,
            RANK() OVER (ORDER BY test_score DESC) AS college_rank
        FROM
            college_scores
      )
      SELECT
          hackathon_id,
          college_id,
          participant_count,
          test_score,
          college_rank
      FROM
          ranked_colleges
      WHERE
          college_id = $2
    `;

    const sqlTotalCollegeCodes = `
      SELECT COUNT(DISTINCT c.id) AS total
      FROM report.profiling_scores1
      INNER JOIN "user" u ON profiling_scores1.user_id = u.id
      INNER JOIN college c ON u.college_id = c.id
    `;

    let totalCollegeCodes = 0;

    try {
      const resultTotalCollegeCodes = await pool.query(sqlTotalCollegeCodes);
      if (resultTotalCollegeCodes.rows.length > 0) {
        totalCollegeCodes = parseInt(resultTotalCollegeCodes.rows[0].total, 10);
      }
    } catch (error) {
      console.error('Error fetching total college codes:', error);
      // Handle specific error condition for fetching total college codes
      return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }

    const { rows } = await pool.query(sql, [hackathon_id, college_id]);

    

    res.json({ rows, totalCollegeCodes }); // Return totalCollegeCodes along with other data
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});



router.get('/marks_section_stats/:id', isAuthenticated, async (req, res) => {
  try {
    const college_id = req.user.college || null;

    if (!college_id) {
      return res.status(400).json({ error: 'College code is not set in the session.' });
    }

    const hackathon_id = req.params.id;

    const cacheKey = `marks_section_stats-${college_id}_${hackathon_id}`;
    const cachedData = await cacheManager.getCachedData(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const marksStats = await fetchMarksStats(pool, college_id, hackathon_id);
    const [aptitudeStats, englishStats, technicalStats] = await Promise.all([
      fetchSectionStats(pool, college_id, hackathon_id, 'aptitude'),
      fetchSectionStats(pool, college_id, hackathon_id, 'english'),
      fetchSectionStats(pool, college_id, hackathon_id, 'coding')
    ]);

    const data = {
      marks_stats: roundValues(marksStats, false),
      aptitude_stats: roundValues(aptitudeStats, true),
      english_stats: roundValues(englishStats, true),
      technical_stats: roundValues(technicalStats, true)
    };

    await cacheManager.setCachedData(cacheKey, data);

    cacheManager.scheduleCacheRefresh(cacheKey, async () => {
      try {
        const refreshedData = {
          marks_stats: roundValues(await fetchMarksStats(pool, college_id, hackathon_id), false),
          aptitude_stats: roundValues(await fetchSectionStats(pool, college_id, hackathon_id, 'aptitude'), true),
          english_stats: roundValues(await fetchSectionStats(pool, college_id, hackathon_id, 'english'), true),
          technical_stats: roundValues(await fetchSectionStats(pool, college_id, hackathon_id, 'coding'), true)
        };
        await cacheManager.setCachedData(cacheKey, refreshedData);
        console.log(`Cache refreshed for key ${cacheKey}`);
      } catch (refreshError) {
        console.error('Error refreshing cache:', refreshError);
      }
    });

    res.json(data);
  } catch (error) {
    console.error('Error in marks_section_stats endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

async function fetchMarksStats(pool, college_id, hackathon_id) {
  const sqlMarksStats = `
    SELECT 
      MAX(total_score) AS highest_marks,
      MIN(total_score) AS lowest_marks,
      AVG(total_score) AS average_marks,
      COUNT(CASE WHEN total_score > (SELECT AVG(total_score) FROM report.assessments_scores WHERE total_score IS NOT NULL) THEN 1 END) AS above_average_count,
      COUNT(CASE WHEN total_score < (SELECT AVG(total_score) FROM report.assessments_scores WHERE total_score != 0 AND total_score IS NOT NULL) THEN 1 END) AS below_average_count_without_zeros,
      COUNT(CASE WHEN total_score = 0 THEN 1 END) AS zero_scores_count
    FROM report.assessments_scores
    INNER JOIN "user" u ON assessments_scores.user_id = u.id
    INNER JOIN college c ON u.college_id = c.id
    WHERE c.id = $1 AND hackathon_id = $2`;

  const { rows } = await pool.query(sqlMarksStats, [college_id, hackathon_id]);
  return rows[0];
}

async function fetchSectionStats(pool, college_id, hackathon_id, column) {
  const sqlSectionStats = `
    SELECT 
      MAX(${column}) AS highest_marks,
      MIN(${column}) AS lowest_marks,
      AVG(${column}) AS average_marks,
      COUNT(CASE WHEN ${column} > (SELECT AVG(${column}) FROM report.assessments_scores WHERE ${column} IS NOT NULL) THEN 1 END) AS above_average_count,
      COUNT(CASE WHEN ${column} < (SELECT AVG(${column}) FROM report.assessments_scores WHERE ${column} != 0 AND ${column} IS NOT NULL) THEN 1 END) AS below_average_count_without_zeros,
      COUNT(CASE WHEN ${column} = 0 THEN 1 END) AS zero_scores_count
    FROM report.assessments_scores
    INNER JOIN "user" u ON assessments_scores.user_id = u.id
    INNER JOIN college c ON u.college_id = c.id
    WHERE c.id = $1 AND assessments_scores.hackathon_id = $2`;

  const { rows } = await pool.query(sqlSectionStats, [college_id, hackathon_id]);
  return rows[0];
}

function roundValues(obj, isSection) {
  const rounded = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (isSection && ['above_average_count', 'below_average_count_without_zeros', 'zero_scores_count'].includes(key)) {
        rounded[key] = parseInt(obj[key], 10);
      } else {
        rounded[key] = parseFloat(obj[key]).toFixed(2);
      }
    }
  }
  return rounded;
}


// Route to get language data
router.get('/language_data/:id', isAuthenticated,async (req, res) => {
  try {
      const college_id = req.user.college || null;

      if (!college_id) {
          return res.status(400).json({ error: 'College code is not set in the session.' });
      }

      const hackathon_id = req.params.id;

      const cacheKey = `emp_language_data_${college_id}_${hackathon_id}`;
      let cachedData = await cacheManager.getCachedData(cacheKey);

      if (cachedData) {
          // Parse cached data if needed (assuming it's stored as JSON)
          return res.status(200).json(cachedData);
      }

      const query = `
          SELECT
              ts.language,
              COUNT(DISTINCT ts.user_id) AS distinct_users
          FROM
              test_submission ts
            INNER JOIN round r on ts.round_id = r.id
            INNER JOIN hackathon h on r.hackathon_id = h.id
          INNER JOIN report.assessments_scores pro ON ts.user_id = pro.user_id and pro.hackathon_id = h.id
          INNER JOIN "user" u ON pro.user_id = u.id
          INNER JOIN college c ON u.college_id = c.id
          WHERE
              c.id = $1 AND ts.language IS NOT NULL and h.id = $2
          GROUP BY
              ts.language
          ORDER BY distinct_users DESC;
      `;

      const { rows } = await pool.query(query, [college_id,hackathon_id]);

      // Cache the data in DynamoDB (assuming cacheManager handles this)
      await cacheManager.setCachedData(cacheKey, rows); // Store data as JSON string

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
          const refreshedData = await pool.query(query, [college_id,hackathon_id]);
          return refreshedData.rows;
      });

      console.log('Serving from database and cached: /language_data');

      // Output JSON
      res.json(rows);
  } catch (error) {
      console.error('Error querying database for language data:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Route to get accuracy scores
router.get('/accuracy_scores/:id',isAuthenticated, async (req, res) => {
  try {
      const college_id = req.user.college || null;

      if (!college_id) {
          return res.status(400).json({ error: 'College code is not set in the session.' });
      }

      const hackathon_id = req.params.id;

      const cacheKey = `accuracy_scores_${college_id}_${hackathon_id}`;
      let cachedData = await cacheManager.getCachedData(cacheKey);

      if (cachedData) {
          // Parse cached data if needed (assuming it's stored as JSON)
          return res.status(200).json(cachedData);
      }

      const query = `
          SELECT
              ts.language,
              ROUND(
                  (SUM(CASE WHEN ts.status = 'pass' THEN 1 ELSE 0 END) * 1.0 /
                  COUNT(*)) * 100, 2) AS accuracy_percentage
          FROM
              test_submission ts
          INNER JOIN round r on ts.round_id = r.id
          INNER JOIN hackathon h on r.hackathon_id = h.id
          INNER JOIN report.assessments_scores pro ON ts.user_id = pro.user_id and pro.hackathon_id = h.id
          INNER JOIN "user" u ON pro.user_id = u.id
          INNER JOIN college c ON u.college_id = c.id
          WHERE
              c.id = $1 AND ts.language IS NOT NULL and h.id = $2
          GROUP BY
              ts.language
          ORDER BY
              accuracy_percentage DESC;
      `;

      const { rows } = await pool.query(query, [college_id,hackathon_id]);

      // Cache the data in DynamoDB (assuming cacheManager handles this)
      await cacheManager.setCachedData(cacheKey, rows); // Store data as JSON string

      // Schedule automatic cache refresh
      cacheManager.scheduleCacheRefresh(cacheKey, async () => {
          const refreshedData = await pool.query(query, [college_id,hackathon_id]);
          return refreshedData.rows;
      });

      console.log('Serving from database and cached: /accuracy_scores');

      // Output JSON
      res.json(rows);
  } catch (error) {
      console.error('Error querying database for accuracy scores:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.get('/emp_band_data/:id', isAuthenticated, async (req, res) => {
  try {
      const college_id = req.user.college || null;

      if (!college_id) {
          return res.status(400).json({ error: 'College code is not set in the session.' });
      }

      const hackathon_id = req.params.id;

      const { degree, branch, year } = req.query;

      const emp_band_counts = { 'A++': 0, 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };
      const best_band_counts = { 'A++': 0, 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };

      let filterConditions = [`c.id = $1 and h.id = $2`];
      let queryParams = [college_id, hackathon_id];

      if (degree) {
          filterConditions.push(`education.degree = $${queryParams.length + 1}`);
          queryParams.push(degree);
      }

      if (branch) {
          filterConditions.push(`education.branch = $${queryParams.length + 1}`);
          queryParams.push(branch);
      }

      if (year) {
          filterConditions.push(`EXTRACT(YEAR FROM education.end_date) = $${queryParams.length + 1}`);
          queryParams.push(year);
      }

      const filterSQL = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

      const sql_combined = `
          WITH user_details AS (
              SELECT
                  u.id AS user_id,
                  u.email,
                  u.phone,
                  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                  c.name AS college_name,
                  education.degree,
                  education.branch,
                  EXTRACT(YEAR FROM education.end_date) AS end_year,
                  report.assessments_overall.employability_band,
                  report.assessments_overall.possible_employability_band,
                  ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY education.end_date DESC) AS rn
              FROM
                  report.assessments_overall
              INNER JOIN
                  "user" u ON report.assessments_overall.user_id = u.id
              INNER JOIN
                  hackathon h ON report.assessments_overall.hackathon_id = h.id
              INNER JOIN
                  college c ON u.college_id = c.id
              LEFT JOIN
                  resume.education_details education ON report.assessments_overall.user_id = education.user_id
              ${filterSQL}
          )
          SELECT
              user_id,
              email,
              phone,
              full_name,
              college_name,
              degree,
              branch,
              end_year,
              employability_band,
              possible_employability_band
          FROM
              user_details
          WHERE
              rn = 1;
      `;

      const { rows } = await pool.query(sql_combined, queryParams);

      rows.forEach(row => {
          if (row.employability_band && emp_band_counts.hasOwnProperty(row.employability_band)) {
              emp_band_counts[row.employability_band] += 1;
          }
          if (row.possible_employability_band && best_band_counts.hasOwnProperty(row.possible_employability_band)) {
              best_band_counts[row.possible_employability_band] += 1;
          }
      });

      const degreeQuery = `
          SELECT DISTINCT education.degree
          FROM resume.education_details education
          INNER JOIN "user" u ON education.user_id = u.id
          INNER JOIN college c ON u.college_id = c.id
          INNER JOIN report.assessments_overall pro ON u.id = pro.user_id
          INNER JOIN hackathon h ON pro.hackathon_id = h.id
          WHERE c.id = $1 AND h.id = $2;
      `;
      const branchQuery = `
          SELECT DISTINCT education.branch
          FROM resume.education_details education
          INNER JOIN "user" u ON education.user_id = u.id
          INNER JOIN college c ON u.college_id = c.id
          INNER JOIN report.assessments_overall pro ON u.id = pro.user_id
          INNER JOIN hackathon h ON pro.hackathon_id = h.id
          WHERE c.id = $1 AND h.id = $2;
      `;
      const yearQuery = `
          SELECT DISTINCT EXTRACT(YEAR FROM education.end_date) AS year
          FROM resume.education_details education
          INNER JOIN "user" u ON education.user_id = u.id
          INNER JOIN college c ON u.college_id = c.id
          INNER JOIN report.assessments_overall pro ON u.id = pro.user_id
          INNER JOIN hackathon h ON pro.hackathon_id = h.id
          WHERE c.id = $1 AND h.id = $2
          ORDER BY year DESC;
      `;

      const degrees = (await pool.query(degreeQuery, [college_id, hackathon_id])).rows.map(row => row.degree);
      const branches = (await pool.query(branchQuery, [college_id, hackathon_id])).rows.map(row => row.branch);
      const years = (await pool.query(yearQuery, [college_id, hackathon_id])).rows.map(row => row.year);

      const response = {
          emp_band_counts,
          best_band_counts,
          filters: {
              degrees,
              branches,
              years
          }
      };

      res.json(response);
  } catch (error) {
      console.error('Error querying database:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});


router.get('/top100/:id', isAuthenticated, async (req, res) => {
  try {
      const college_id = req.user.college || null;
      const hackathon_id = req.params.id || null; // Get hackathon_id from URL parameters

      // Check if college_id and hackathon_id are present
      if (!college_id) {
          return res.status(400).json({ error: 'College code is not set in the session.' });
      }
      
      if (!hackathon_id) {
          return res.status(400).json({ error: 'Hackathon ID is not provided in the URL.' });
      }

      // Query to fetch top 100 students based on total score
      const query = `
          SELECT 
              u.image,
              u.first_name,
              u.email,
              ROUND(aptitude) AS aptitude, 
              ROUND(english) AS english, 
              ROUND(coding) AS coding, 
              ROUND(total_score) AS total_score, 
              comment, 
              employability_band, 
              possible_employability_band, 
              aptitude_improvement_suggestions, 
              english_improvement_suggestions, 
              technical_improvement_suggestions
          FROM 
              report.assessments_overall pro
          INNER JOIN 
              "user" u ON pro.user_id = u.id
          INNER JOIN 
              college c ON u.college_id = c.id
          INNER JOIN 
              hackathon h ON pro.hackathon_id = h.id
          WHERE c.id = $1 AND h.id = $2
          ORDER BY 
              total_score DESC
          LIMIT 100
      `;

      // Execute the query with the college_id and hackathon_id parameters
      const { rows } = await pool.query(query, [college_id, hackathon_id]);

      // Return the fetched rows as the response
      return res.json(rows);
  } catch (error) {
      console.error('Error fetching top 100 students:', error);
      return res.status(500).json({ error: 'Internal server error.' });
  }
});





module.exports = router;
