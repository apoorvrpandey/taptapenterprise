function smoothScroll(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
      behavior: 'smooth'
    });
  }
  
  
  
  function showRightHalf(sectionId, element) {
    // Hide all sections
    const sections = document.querySelectorAll('.righthalf-part');
    sections.forEach(section => {
      section.classList.remove('active');
    });
  
    // Remove 'active' class from all quarters
    const quarters = document.querySelectorAll('.quarter');
    quarters.forEach(quarter => {
      quarter.classList.remove('active');
    });
  
    // Show the selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
      activeSection.classList.add('active');
    }
  
    // Add 'active' class to the clicked quarter
    if (element) {
      element.classList.add('active');
    }
  }
  
  // Initial display setup
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('live-sessions').classList.add('active');
  });
  
  
  // chart.js
  
  
  
  
  
    // Function to update the page numbers
    function updatePageNumbers() {
      const totalPages = Math.ceil(rows.length / rowsPerPage);
      const pageNumbersElement = document.getElementById('page-numbers');
      pageNumbersElement.innerHTML = '';
      
      for (let i = 1; i <= totalPages; i++) {
        const pageNumber = document.createElement('span');
        pageNumber.textContent = i;
        if (i === currentPage) {
          pageNumber.classList.add('current-page');
        }
        pageNumber.addEventListener('click', () => {
          currentPage = i;
          showRows();
          updatePageNumbers();
        });
        pageNumbersElement.appendChild(pageNumber);
      }
    }
  
    
   // Student activities
  // Student activities
  function toggleSection(sectionId, clickedLink) {
  console.log("Toggling section:", sectionId); // Debugging line
  // Hide all sections
  const sections = document.querySelectorAll('.stu-act');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove 'active' class from all links
  const links = document.querySelectorAll('.sa-links-container a');
  links.forEach(link => {
    link.classList.remove('active');
  });
  
  // Show the selected section
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active');
  } else {
    console.error("No section found with ID:", sectionId); // Debugging line
  }
  
  // Add 'active' class to the clicked link
  if (clickedLink) {
    clickedLink.classList.add('active');
  }
  }
  
  // Initial display setup
  document.addEventListener('DOMContentLoaded', () => {
  const defaultSection = document.getElementById('absentees-assessments'); // Ensure this matches your default section ID
  if (defaultSection) {
    defaultSection.classList.add('active');
  } else {
    console.error("No default section found with ID: section1"); // Debugging line
  }
  });
  
  
  
  
  
  
  function toggleAttendanceSection(sectionId, link) {
  // Hide all sections
  const sections = document.querySelectorAll('.sattendance');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove 'active' class from all links
  const links = document.querySelectorAll('.sattendance-links-container a');
  links.forEach(link => {
    link.classList.remove('active');
  });
  
  // Show the selected section
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active');
  } else {
    console.error(`No section found with ID: ${sectionId}`);
  }
  
  // Add 'active' class to the clicked link
  if (link) {
    link.classList.add('active');
  }
  }
  
  // Initial display setup
  document.addEventListener('DOMContentLoaded', () => {
  const defaultSection = document.getElementById('event-report-download'); // Ensure this ID matches your default section
  if (defaultSection) {
    defaultSection.classList.add('active');
  } else {
    console.error("No default section found with ID: 'default-section-id'");
  }
  });
  