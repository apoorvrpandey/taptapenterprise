// File path: routes/marks_section_stats.js

const { Pool } = require('pg');
const express = require('express');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const cacheManager = require('../utlis/cacheManager'); // Ensure this path is correct
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');

router.get('/marks_section_stats',isAuthenticated, async (req, res) => {
    try {
        const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'College code is not set in the session.' });
        }

        const cacheKey = `marks_section_stats-${college_id}`;
        const cachedData = await cacheManager.getCachedData(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const marksStats = await fetchMarksStats(pool, college_id);
        const [aptitudeStats, englishStats, technicalStats] = await Promise.all([
            fetchSectionStats(pool, college_id, 'aptitude'),
            fetchSectionStats(pool, college_id, 'english'),
            fetchSectionStats(pool, college_id, 'coding')
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
                    marks_stats: roundValues(await fetchMarksStats(pool, college_id), false),
                    aptitude_stats: roundValues(await fetchSectionStats(pool, college_id, 'aptitude'), true),
                    english_stats: roundValues(await fetchSectionStats(pool, college_id, 'english'), true),
                    technical_stats: roundValues(await fetchSectionStats(pool, college_id, 'coding'), true)
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

async function fetchMarksStats(pool, college_id) {
    const sqlMarksStats = `
        SELECT 
            MAX(total_score) AS highest_marks,
            MIN(total_score) AS lowest_marks,
            AVG(total_score) AS average_marks,
            COUNT(CASE WHEN total_score > (SELECT AVG(total_score) FROM report.profiling_scores1 WHERE total_score IS NOT NULL) THEN 1 END) AS above_average_count,
            COUNT(CASE WHEN total_score < (SELECT AVG(total_score) FROM report.profiling_scores1 WHERE total_score != 0 AND total_score IS NOT NULL) THEN 1 END) AS below_average_count_without_zeros,
            COUNT(CASE WHEN total_score = 0 THEN 1 END) AS zero_scores_count
        FROM report.profiling_scores1
        INNER JOIN "user" u ON profiling_scores1.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        WHERE c.id = $1`;

    const { rows } = await pool.query(sqlMarksStats, [college_id]);
    return rows[0];
}

async function fetchSectionStats(pool, college_id, column) {
    const sqlSectionStats = `
        SELECT 
            MAX(${column}) AS highest_marks,
            MIN(${column}) AS lowest_marks,
            AVG(${column}) AS average_marks,
            COUNT(CASE WHEN ${column} > (SELECT AVG(${column}) FROM report.profiling_scores1 WHERE ${column} IS NOT NULL) THEN 1 END) AS above_average_count,
            COUNT(CASE WHEN ${column} < (SELECT AVG(${column}) FROM report.profiling_scores1 WHERE ${column} != 0 AND ${column} IS NOT NULL) THEN 1 END) AS below_average_count_without_zeros,
            COUNT(CASE WHEN ${column} = 0 THEN 1 END) AS zero_scores_count
        FROM report.profiling_scores1
        INNER JOIN "user" u ON profiling_scores1.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        WHERE c.id = $1`;

    const { rows } = await pool.query(sqlSectionStats, [college_id]);
    return rows[0];
}

function roundValues(obj, isSection) {
    const rounded = {};
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            if (isSection && ['above_average_count', 'below_average_count_without_zeros', 'zero_scores_count'].includes(key)) {
                rounded[key] = parseInt(obj[key], 10);
            } else {
                rounded[key] = parseFloat(obj[key]).toFixed(2);
            }
        }
    }
    return rounded;
}

module.exports = router;
