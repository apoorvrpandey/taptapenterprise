import React from 'react';
import '../public/css/nav_log.css' // Assuming you have a CSS file for styling

const Sidebar = () => {
  return (
    <div className="sidebar" style={{height:"100vh" }}>
      <a className="logo" style={{ textAlign: 'center', alignItems: 'center', padding: '5px' }}>
        <img src="img/sidebar logo.png" alt="Logo" style={{ width: '58px', maxWidth: '100%', height: '90px' }} />
      </a>
      <a href="myDashboard" style={{ backgroundColor: '#88eb4c' }}>
        <div className="menu-item active">
          <img src="img/dash.png" alt="dash" style={{ maxWidth: '22px', height: '22px' }} />
          <span style={{ color: 'black' }}>Dashboard</span>
        </div>
      </a>
      <a href="employabilityReport" className="menu-item">
        <img src="img/emp.png" alt="employability" style={{ maxWidth: '18px', height: '20px' }} />
        <span>Employability</span>
      </a>
      <a href="https://admin.hackathon.blackbucks.me" className="menu-item">
        <img alt="Assessment icon" src="img/assessment.png" style={{ maxWidth: '19px', height: '19.5px' }} />
        <span>Assessments</span>
      </a>
      <a href="jobsDashboard" className="menu-item">
        <img src="img/jobs.png" alt="jobs" style={{ maxWidth: '20px', height: '21px' }} />
        <span>Jobs</span>
      </a>
      <a href="https://admin.hackathon.blackbucks.me/createAndManageCourse/" className="menu-item">
        <img alt="course icon" src="img/course.png" style={{ maxWidth: '19px', height: '20px' }} />
        <span>Course</span>
      </a>
      <a href="https://admin.hackathon.blackbucks.me/lessonPlan/" className="menu-item">
        <img alt="lessonplan icon" src="img/lessonplan.png" style={{ maxWidth: '23px', height: '18px' }} />
        <span>Lesson Plan</span>
      </a>
      <a href="trainingsDashboard" className="menu-item">
        <img src="img/trainings.png" alt="trainings" style={{ maxWidth: '27px', height: '21px' }} />
        <span>Trainings</span>
      </a>
      <a href="internshipsDashboard" className="menu-item">
        <img src="img/internship_whiteicon.png" alt="manage" style={{ width: '20px', height: 'auto' }} />
        <span>Internships</span>
      </a>
      <a href="https://admin.hackathon.blackbucks.me/createAndManageLabTest/" className="menu-item">
        <img alt="vpl icon" src="img/vpl.png" style={{ maxWidth: '19px', height: '17px' }} />
        <span>VPL</span>
      </a>
    </div>
  );
};

export default Sidebar;
