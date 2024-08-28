
import { getCachedData, setCachedData } from "./cache";
import { readPool } from "./pool";


export async function getNoOfCandidates(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `noOfCandidates_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;
  }

  const result = await readPool.query(`
    SELECT COUNT(*) AS total_enrolled_candidates
    FROM "user" u
    INNER JOIN college c ON u.college_id = c.id
    WHERE c.id = $1
  `, [collegeId]);

  await setCachedData(cacheKey, result);
  console.log(`Cache set for key ${cacheKey}`);
  return result
}

export async function getVariousYears(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `variousYears_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;
  }
  const result = await readPool.query(`
    SELECT
      COUNT(*) AS total_enrolled_candidates,
      CASE
        WHEN EXTRACT(YEAR FROM ed.end_date AT TIME ZONE 'UTC' + INTERVAL '5 hours 30 minutes') IS NULL THEN 'Not Provided'
        ELSE EXTRACT(YEAR FROM ed.end_date AT TIME ZONE 'UTC' + INTERVAL '5 hours 30 minutes')::TEXT
      END AS YOP
    FROM
      "user" u
    INNER JOIN
      college c ON u.college_id = c.id
    LEFT JOIN
      resume.education_details ed ON u.id = ed.user_id
    WHERE
      c.id = $1
      AND (ed.stage = 'Degree' OR ed.stage IS NULL)
    GROUP BY
      YOP
    ORDER BY
      YOP;
  `, [collegeId]);
  await setCachedData(cacheKey, result);
  console.log(`Cache set for key ${cacheKey}`);
  return result;
}

export async function getVariousBranches(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `variousBranches_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;
  }
  const result = await readPool.query(`
    SELECT
      COUNT(*) AS total_enrolled_candidates,
      BTechBranch
    FROM (
      SELECT
        u.id,
        COALESCE(MAX(CASE WHEN ed.stage = 'Degree' THEN ed.branch END), 'Not Provided') AS BTechBranch
      FROM
        "user" u
      INNER JOIN
        college c ON u.college_id = c.id
      LEFT JOIN
        resume.education_details ed ON u.id = ed.user_id
      WHERE
        c.id = $1
      GROUP BY
        u.id
    ) subquery
    GROUP BY
      BTechBranch
  `, [collegeId]);
  await setCachedData(cacheKey, result);
  console.log(`Cache set for key ${cacheKey}`);
  return result;

}

export async function getEnrollments(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `enrollments_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;
  }

  const totallyEnrolled = await readPool.query(`
    SELECT COUNT(*)
    FROM report.trainings
    WHERE CAST(college_id AS INTEGER) = $1;
  `, [collegeId]);

  const totallyCompleted = await readPool.query(`
    SELECT COUNT(*) FILTER (WHERE end_date < CURRENT_TIMESTAMP) AS completed_trainings
    FROM report.trainings
    WHERE CAST(college_id AS INTEGER) = $1;
  `, [collegeId]);

  const totallyStarted = await readPool.query(`
    SELECT COUNT(regno)
    FROM report.trainings t
    INNER JOIN report.phase p ON t.id = p.training_id
    INNER JOIN report.phase_batch pb ON p.id = pb.phase_id
    INNER JOIN report.batch_data bd ON pb.batch_id = bd.batch_id
    WHERE CAST(t.college_id AS INTEGER) = $1;
  `, [collegeId]);

  await setCachedData(cacheKey, {
    totallyEnrolled: totallyEnrolled.rows[0].count || 0,
    totallyCompleted: totallyCompleted.rows[0].completed_trainings || 0,
    totallyStarted: totallyStarted.rows[0].count || 0,
  });
  console.log(`Cache set for key ${cacheKey}`);
  return {
    totallyEnrolled: totallyEnrolled.rows[0].count,
    totallyCompleted: totallyCompleted.rows[0].completed_trainings,
    totallyStarted: totallyStarted.rows[0].count,
  };
}


export async function getAssessments(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `assessments_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;
  }

  const result = await readPool.query(`
   select tt.name, count(user_id) from user_hackathon_participation uhp
INNER JOIN "user" u on uhp.user_id = u.id
INNER JOIN college c on u.college_id = c.id
INNER JOIN hackathon h on uhp.hackathon_id = h.id
INNER JOIN test_type tt on h.test_type_id = tt.id
where c.id = $1
group by tt.name
`, [collegeId]);
  await setCachedData(cacheKey, result.rows);
  console.log(`Cache set for key ${cacheKey}`);
  return result.rows;
}

export async function getAssessmentsPar(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `assessmentsPar_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;
  }

  const result = await readPool.query(`
   SELECT
  
    COUNT(CASE WHEN uhp.start_time >= CURRENT_DATE - INTERVAL '7 days' THEN uhp.user_id END) AS last_7_days_count,
    COUNT(CASE WHEN uhp.start_time >= CURRENT_DATE - INTERVAL '30 days' THEN uhp.user_id END) AS last_30_days_count,
    COUNT(CASE WHEN uhp.start_time >= CURRENT_DATE - INTERVAL '2 months' THEN uhp.user_id END) AS last_2_months_count
FROM
    user_hackathon_participation uhp
INNER JOIN
    "user" u ON uhp.user_id = u.id
INNER JOIN
    college c ON u.college_id = c.id
INNER JOIN
    hackathon h ON uhp.hackathon_id = h.id
INNER JOIN
    test_type tt ON h.test_type_id = tt.id
WHERE
    c.id = $1
    AND uhp.start_time IS NOT NULL
  `, [collegeId]);
  await setCachedData(cacheKey, result.rows);
  console.log(`Cache set for key ${cacheKey}`);
  return result.rows;
}

export async function getTapTap(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `tapTap_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;

  }
  const { rows: lessonplan } =
    await readPool.query(`select lp.lesson_plan_type, count(*) from lesson_plan lp
group by lp.lesson_plan_type
`);

  const { rows: problems } =
    await readPool.query(`select type,count(*) from problem
group by type`);

  const { rows: courses } =
    await readPool.query(`select COUNT(*) from course.course
`);
  await setCachedData(cacheKey, {
    lessonplan,
    problems,
    courses,
  });
  console.log(`Cache set for key ${cacheKey}`);
  return {
    lessonplan,
    problems,
    courses,
  };

}

export async function getOngoingTrainings(collegeId) {
  if (!collegeId) return null;
  const cacheKey = `ongoingTrainings_${collegeId}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key ${cacheKey}`);
    return cachedData;
  }
  const {rows} = await readPool.query(`
    SELECT 
        id,
        title,
        description,
        total_training_hours,
        trainings_type_id,
        college_id,
        start_date,
        end_date,
        banner
      FROM 
        report.trainings  WHERE college_id = $1 order by title;
      `,
    [collegeId]);
  await setCachedData(cacheKey, rows);
  console.log(`Cache set for key ${cacheKey}`);
  return rows;
}