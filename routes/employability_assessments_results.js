const { Pool } = require('pg');
const express = require('express');
const router = express.Router();
const cacheManager = require('../utlis/cacheManager.js'); // Ensure this path is correct
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const isAuthenticated = require('../jwtAuth.js');

// Helper function to create SQL query
const createSQLQuery = (params) => {
    const {
        degree,
        branch,
        year,
        empBand,
        empBestBand,
        tenthPercentage,
        twelfthPercentage,
        gradPercentage
    } = params;

    let sqlQuery = `
    WITH userhackathonreport AS (
        SELECT
            uhp.user_id,
            uhp.hackathon_id,
            date_trunc('month', uhp.update_at) AS month,
            h.test_type_id,
            jsonb_array_elements(uhp.report -> 'questionReports') AS questionReports
        FROM
            user_hackathon_participation uhp
        JOIN
            hackathon h ON uhp.hackathon_id = h.id
    ),
    questionreport AS (
        SELECT
            uhr.user_id,
            uhr.hackathon_id,
            uhr.test_type_id,
            uhr.month,
            (uhr.questionReports -> 'report' -> 'roundId')::numeric AS roundId,
            (uhr.questionReports -> 'report' -> 'id')::numeric AS problemId,
            round((uhr.questionReports -> 'report' -> 'totalScore')::numeric, 2) AS obtainedScore,
            uhr.questionReports -> 'report' ->> 'language' AS language,
            uhr.questionReports -> 'report' ->> 'status' AS status
        FROM
            userhackathonreport uhr
        WHERE
            uhr.test_type_id IN (6, 36)
    ),
    testcasereport AS (
        SELECT
            qr.user_id,
            qr.language,
            count(*) FILTER (WHERE qr.status = 'pass') AS testCasePassedCount,
            count(*) FILTER (WHERE qr.status <> 'unAttempted') AS testCaseAttemptedCount
        FROM
            questionreport qr
        WHERE
            qr.language IS NOT NULL
        GROUP BY
            qr.user_id, qr.language
    ),
    testcasesummary AS (
        SELECT
            tcr.user_id,
            tcr.language,
            sum(tcr.testCaseAttemptedCount) AS attemptedCount,
            sum(tcr.testCasePassedCount) AS passedCount
        FROM
            testcasereport tcr
        GROUP BY
            tcr.user_id, tcr.language
    ),
    coding_scores AS (
        SELECT
            tcs.user_id,
            round((sum(tcs.passedCount) / NULLIF(sum(tcs.attemptedCount), 0)) * sum(tcs.passedCount), 2) AS codingScore,
            round((sum(tcs.passedCount) / NULLIF(sum(tcs.attemptedCount), 0)) * 100, 2) AS codingAccuracy,
            max(CASE WHEN tcs.language = 'java' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * tcs.passedCount, 2) END) AS javaScore,
            max(CASE WHEN tcs.language = 'java' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * 100, 2) END) AS javaAccuracy,
            max(CASE WHEN tcs.language = 'python' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * tcs.passedCount, 2) END) AS pythonScore,
            max(CASE WHEN tcs.language = 'python' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * 100, 2) END) AS pythonAccuracy,
            max(CASE WHEN tcs.language = 'c' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * tcs.passedCount, 2) END) AS cScore,
            max(CASE WHEN tcs.language = 'c' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * 100, 2) END) AS cAccuracy,
            max(CASE WHEN tcs.language = 'cpp' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * tcs.passedCount, 2) END) AS cppScore,
            max(CASE WHEN tcs.language = 'cpp' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * 100, 2) END) AS cppAccuracy,
            max(CASE WHEN tcs.language = 'sql' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * tcs.passedCount, 2) END) AS sqlScore,
            max(CASE WHEN tcs.language = 'sql' THEN round((tcs.passedCount / NULLIF(tcs.attemptedCount, 0)) * 100, 2) END) AS sqlAccuracy
        FROM
            testcasesummary tcs
        GROUP BY
            tcs.user_id
    ),
    education_summary AS (
    SELECT
        ed.user_id,
        MAX(CASE WHEN ed.stage = 'Tenth' THEN ed.percentage END) AS tenth_cgpa,
        MAX(CASE WHEN ed.stage = 'Twelfth' THEN ed.percentage END) AS twelfth_cgpa,
        MAX(CASE WHEN ed.stage = 'Degree' THEN ed.percentage END) AS BTech_cgpa,
        MAX(CASE WHEN ed.stage = 'Degree' THEN ed.degree END) AS BTechDegree,
        MAX(CASE WHEN ed.stage = 'Degree' THEN ed.branch END) AS BTechBranch,
        MAX(CASE WHEN ed.stage = 'Degree' THEN EXTRACT(YEAR FROM ed.end_date AT TIME ZONE 'UTC' + INTERVAL '5 hours 30 minutes') END)  AS YOP
    FROM
        resume.education_details ed
    GROUP BY
        ed.user_id
)
    SELECT DISTINCT u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS Name,
        u.email,
        u.roll_number,
        YOP,
        BTechDegree,
        BTechBranch,
        round(total_score, 2) AS total_score,
        round(aptitude, 2) AS aptitude,
        round(coding, 2) AS coding,
        round(english, 2) AS english,
        employability_band,
        possible_employability_band,
        userdetails.profile_score,
        userdetails.github_id,
        userdetails.linkedin_id,
        userdetails.hacker_rank_id,
        userdetails.leet_code_id,
        tenth_cgpa,
        twelfth_cgpa,
        BTech_cgpa,
        cs.codingScore,
        cs.codingAccuracy,
        cs.javaScore,
        cs.javaAccuracy,
        cs.pythonScore,
        cs.pythonAccuracy,
        cs.cScore,
        cs.cAccuracy,
        cs.cppScore,
        cs.cppAccuracy,
        cs.sqlScore,
        cs.sqlAccuracy,
        comment,
        aptitude_improvement_suggestions,
        technical_improvement_suggestions,
        english_improvement_suggestions
    FROM 
    report.profiling_report_overall rpo
    LEFT JOIN     education_summary es ON u.id = es.user_id
    LEFT JOIN resume.user_details userdetails ON subquery.user_id = userdetails."user"
    LEFT JOIN "user" u ON userdetails."user" = u.id
    LEFT JOIN college c ON u.college_id = c.id
    LEFT JOIN resume.certificate certificate ON userdetails."user" = certificate.user_id
    LEFT JOIN resume.my_goal goal ON userdetails."user" = goal.user_id
    LEFT JOIN resume.project project ON userdetails."user" = project.user_id
    LEFT JOIN resume.technical_experience experience ON userdetails."user" = experience.user_id
    LEFT JOIN coding_scores cs ON cs.user_id = u.id
    WHERE c.id = $1`;

    const values = [params.college_id];
    let index = 2;

    if (degree) {
        sqlQuery += ` AND BTechDegree = ANY($${index++})`;
        values.push(degree.split(','));
    }
    if (branch) {
        sqlQuery += ` AND BTechBranch = ANY($${index++})`;
        values.push(branch.split(','));
    }
    if (year) {
        sqlQuery += ` AND YOP = ANY($${index++})`;
        values.push(year.split(','));
    }
    if (empBand) {
        sqlQuery += ` AND employability_band = ANY($${index++})`;
        values.push(empBand.split(','));
    }
    if (empBestBand) {
        sqlQuery += ` AND possible_employability_band = ANY($${index++})`;
        values.push(empBestBand.split(','));
    }
    if (tenthPercentage) {
        sqlQuery += ` AND tenth_cgpa >= $${index++}`;
        values.push(tenthPercentage);
    }
    if (twelfthPercentage) {
        sqlQuery += ` AND twelfth_cgpa >= $${index++}`;
        values.push(twelfthPercentage);
    }
    if (gradPercentage) {
        sqlQuery += ` AND BTech_cgpa >= $${index++}`;
        values.push(gradPercentage);
    }

    sqlQuery += ' ORDER BY u.id;';

    return { sqlQuery, values };
};

router.get('/emp_band_data',isAuthenticated, async (req, res) => {
    try {
        const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'College code is not set in the session.' });
        }

        const params = {
            college_id,
            degree: req.query.degree,
            branch: req.query.branch,
            year: req.query.year,
            empBand: req.query.empBand,
            empBestBand: req.query.empBestBand,
            tenthPercentage: req.query.tenthPercentage,
            twelfthPercentage: req.query.twelfthPercentage,
            gradPercentage: req.query.gradPercentage,
        };

        const cacheKey = `emp_band_data_${college_id}_${params.degree}_${params.branch}_${params.year}_${params.empBand}_${params.empBestBand}_${params.tenthPercentage}_${params.twelfthPercentage}_${params.gradPercentage}`;
        const cachedData = await cacheManager.getCachedData(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const { sqlQuery, values } = createSQLQuery(params);
        const { rows } = await pool.query(sqlQuery, values);

        await cacheManager.setCachedData(cacheKey, rows);

        cacheManager.scheduleCacheRefresh(cacheKey, async () => {
            const refreshedData = await pool.query(sqlQuery, values);
            if (refreshedData.rows.length > 0) {
                await cacheManager.setCachedData(cacheKey, refreshedData.rows);
                console.log(`Cache refreshed for key ${cacheKey}`);
            }
        });

        return res.json(rows);
    } catch (error) {
        console.error('Error executing emp_band_data query:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// Endpoint for fetching filters
const fetchFilterData = async (query, college_id, res, filterKey) => {
    try {
        const { rows } = await pool.query(query, [college_id]);
        return res.json(rows.map(row => row[filterKey]));
    } catch (error) {
        console.error(`Error fetching ${filterKey}:`, error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

router.get('/filters/degrees',isAuthenticated, (req, res) => {
    const college_id = req.user.college || null;
    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }
    const query = `
        SELECT DISTINCT education.degree
        FROM resume.education_details education
        INNER JOIN "user" u ON education.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        INNER JOIN report.profiling_scores1 ps ON u.id = ps.user_id
        WHERE c.id = $1;
    `;
    fetchFilterData(query, college_id, res, 'degree');
});

router.get('/filters/branches',isAuthenticated, (req, res) => {
    const college_id = req.user.college || null;
    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }
    const query = `
        SELECT DISTINCT education.branch
        FROM resume.education_details education
        INNER JOIN "user" u ON education.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        INNER JOIN report.profiling_scores1 ps ON u.id = ps.user_id
        WHERE c.id = $1;
    `;
    fetchFilterData(query, college_id, res, 'branch');
});

router.get('/filters/years',isAuthenticated, (req, res) => {
    const college_id = req.user.college || null;
    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }
    const query = `
        SELECT DISTINCT EXTRACT(YEAR FROM education.end_date) AS year
        FROM resume.education_details education
        INNER JOIN "user" u ON education.user_id = u.id
        INNER JOIN college c ON u.college_id = c.id
        INNER JOIN report.profiling_scores1 ps ON u.id = ps.user_id
        WHERE c.id = $1
        ORDER BY year DESC;
    `;
    fetchFilterData(query, college_id, res, 'year');
});

router.get('/filters/employabilityBands',isAuthenticated, (req, res) => {
    const college_id = req.user.college || null;
    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }
    const query = `
        SELECT DISTINCT report.profiling_report_overall.employability_band
        FROM report.profiling_report_overall
        LEFT JOIN "user" u ON report.profiling_report_overall.user_id = u.id
        LEFT JOIN college c ON u.college_id = c.id
        WHERE c.id = $1;
    `;
    fetchFilterData(query, college_id, res, 'employability_band');
});

router.get('/filters/possibleEmployabilityBands',isAuthenticated, (req, res) => {
    const college_id = req.user.college || null;
    if (!college_id) {
        return res.status(400).json({ error: 'College code is not set in the session.' });
    }
    const query = `
        SELECT DISTINCT report.profiling_report_overall.possible_employability_band
        FROM report.profiling_report_overall
        LEFT JOIN "user" u ON report.profiling_report_overall.user_id = u.id
        LEFT JOIN college c ON u.college_id = c.id
        WHERE c.id = $1;
    `;
    fetchFilterData(query, college_id, res, 'possible_employability_band');
});

module.exports = router;
