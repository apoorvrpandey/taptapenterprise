import React from 'react';
import { readPool } from '../app/pool';


// JobCard Component
const JobCard = ({ company, title, location, ctc, skills, date, logoUrl, drive_type }) => {
  return (
    <div
      style={{
        marginTop: '5px',
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <img
        src={logoUrl || 'img/google.png'}
        alt='Company Logo'
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '0.25rem',
          marginRight: '1rem',
        }}
      />
      <div style={{ flex: '1' }}>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: '500',
            margin: '0',
          }}
        >
          {company}{' '}
         
        </h3>
        <p
          style={{
            margin: '0.5rem 0',
            fontSize: '0.875rem',
            color: '#555',
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: '0',
            fontSize: '0.875rem',
            color: '#555',
          }}
        >
          {location}
        </p>
        <p
          style={{
            margin: '0',
            fontSize: '0.875rem',
            color: '#555',
          }}
        >
          {ctc}
        </p>
        <p
          style={{
            margin: '0',
            fontSize: '0.875rem',
            color: '#000',
            fontWeight: '500',
          }}
        >
          Required Skills: {skills}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              backgroundColor: '#8A2BE2',
              color: '#ffffff',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                marginRight: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
             👑 
             
            </span>
            {drive_type}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.875rem',
          }}
        >
          <div
            style={{
              marginRight: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              marginTop: '0.75rem',
            }}
          >
            🗓️
          </div>
          <div>
            <p
              style={{
                margin: '0',
                color: '#000',
              }}
            >
              {date}
            </p>
            <p
              style={{
                margin: '0',
                color: '#555',
              }}
            >
              Last date for Application
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Jobs Component
const Jobs = async ({ company }) => {
  // Assuming you have a function to fetch the job data, e.g., using fetch or an API call.
  const query = `
    SELECT
        jp.id AS job_post_id,
        jp.company_title,
        TO_CHAR(jp.create_at, 'YYYY-MM-DD') AS create_at,
        jp.drive_type,
        jp.job_post_title,
        jp.job_post_logo_url,
        jp.description,
        CASE
            WHEN jp.is_ctc_required = TRUE THEN CONCAT(jp.min_salary_lpa::TEXT, ' LPA - ', jp.max_salary_lpa::TEXT, ' LPA')
            ELSE 'Not disclosed'
        END AS salary_range_or_not_disclosed,
        jp.employment_type,
        jp.office_mode,     
        jp.open_drive_link  
    FROM
        job_post jp
    WHERE
        jp.status = 'published'
        AND jp.company_title = $1
`;

const jobs = await readPool.query(query, [company.company_name]);

console.log(jobs.rows);

  return (
    <div style={{ margin: 'auto', marginTop: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Search Section */}
        <div
          style={{
            background: 'rgba(121, 98, 189, 0.1)',
            padding: '10px',
            borderRadius: '0.5rem',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
            width: '25%',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              marginBottom: '1rem',
            }}
          >
            SEARCHING SECTION
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor='search-title'
              style={{
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Search Job Title
            </label>
            <input
              type='text'
              id='search-title'
              placeholder='search job title'
              style={{
                width: '80%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor='search-location'
              style={{
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Search Location
            </label>
            <input
              type='text'
              id='search-location'
              placeholder='select the place'
              style={{
                width: '80%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
              }}
            />
          </div>

        </div>

        {/* Job Listings Section */}
        <div style={{ width: '75%' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
            }}
          >
            Popular Careers with{' '}
            <span style={{ color: '#8A2BE2' }}>{company.company_name}</span> Job
            Seekers
          </h2>
          <div>
            {jobs.rows.length===0&&<div style={{color:'#555',fontSize:'0.9em',marginTop:'10px'}}>No Jobs found</div>}
            {jobs.rows.map((job) => (
              <JobCard
                key={job.job_post_id}
                company={job.company_title}
                title={job.job_post_title}
                location={`${job.employment_type} | ${job.office_mode}`}
                ctc={job.salary_range || 'Not disclosed'}
                skills='Technical Skills' // Replace with actual skills if available
                date={job.create_at}
                logoUrl={job.job_post_logo_url}
                drive_type={job.drive_type}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
