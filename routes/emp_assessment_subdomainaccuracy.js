const { Pool } = require('pg');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const dbConfig = require('../read_replica_config.js');
const pool = new Pool(dbConfig);
const cacheManager = require('../utlis/cacheManager.js'); // Ensure this path is correct
const isAuthenticated = require('../jwtAuth.js');

async function fetchSubDomainStats(college_id, hackathon_id) {
    const sql = `SELECT 
                    sda.sub_domain,
                    ROUND(AVG(sda.accuracy), 2) AS average_accuracy
                FROM 
                    report.assessment_subdomain_accuracy sda
                JOIN 
                    "user" u ON sda.user_id = u.id
                JOIN 
                    college c ON u.college_id = c.id
                JOIN 
                    hackathon h ON sda.hackathon_id = h.id
                WHERE 
                    c.id = $1 AND h.id = $2
                GROUP BY 
                    sda.sub_domain
                ORDER BY 
                    average_accuracy DESC`;

    const result = await pool.query(sql, [college_id, hackathon_id]);

    const sub_domain_stats = [];
    const weak_areas = [];
    const improvement_areas = [];
    const strong_areas = [];

    result.rows.forEach(row => {
        const sub_domain = row.sub_domain;
        const average_accuracy = parseFloat(row.average_accuracy);

        if (average_accuracy < 40) {
            weak_areas.push(sub_domain);
        } else if (average_accuracy >= 40 && average_accuracy <= 70) {
            improvement_areas.push(sub_domain);
        } else {
            strong_areas.push(sub_domain);
        }

        sub_domain_stats.push(row);
    });

    return {
        sub_domain_stats,
        weak_areas,
        improvement_areas,
        strong_areas
    };
}

router.get('/sub_domain_stats/:id', isAuthenticated, async (req, res) => {
    try {
        // Retrieve college code from session
        const college_id = req.user.college || null;

        if (!college_id) {
            return res.status(400).json({ error: 'College code is not set in the session.' });
        }

        // Retrieve hackathon_id from URL parameters
        const hackathon_id = req.params.id;

        // Check if data exists in cache
        const cacheKey = `sub_domain_stats_${college_id}_${hackathon_id}`;
        const cachedData = await cacheManager.getCachedData(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Fetch data from the database
        const data = await fetchSubDomainStats(college_id, hackathon_id);

        await cacheManager.setCachedData(cacheKey, data); // Cache data in DynamoDB

        // Schedule automatic cache refresh
        cacheManager.scheduleCacheRefresh(cacheKey, async () => {
            const refreshedData = await fetchSubDomainStats(college_id, hackathon_id);
            await cacheManager.setCachedData(cacheKey, refreshedData);
            console.log(`Cache refreshed for key ${cacheKey}`);
        });

        // Output JSON
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;
