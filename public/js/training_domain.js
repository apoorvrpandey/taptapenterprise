
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

// Get data from table - live sessions table chart
// Get data from table - live sessions table chart
const labels = [];
const data = [];

document.querySelectorAll('.otable tbody tr').forEach(function(row) {
const label = row.querySelector('td:first-child').textContent.trim();
const value = parseFloat(row.querySelector('td:last-child').textContent.trim());

// Debugging logs
console.log(`Label: ${label}, Value: ${value}`);

labels.push(label);
data.push(value);
});

// Log the collected data
console.log('Collected Labels:', labels);
console.log('Collected Data:', data);

// Define colors for the chart
const chartColors = ['#C084FC', '#2563EB', '#FB923C', '#CCF6A4'];

// Check if canvas element exists
const canvasElement = document.getElementById('myChart');
if (!canvasElement) {
console.error('Canvas element with ID "myChart" not found.');
} else {
const livectx = canvasElement.getContext('2d');

// Calculate total
const total = data.reduce((sum, value) => sum + value, 0);

// Create donut chart
const centerTextLine = {
  id: 'centerTextLine',
  beforeDatasetsDraw(chart, args, options) {
    const datasetMeta = chart.getDatasetMeta(0);
    console.log('Dataset Meta:', datasetMeta);

    // Draw 'Live Sessions' and total number in the center
    const { ctx, chartArea: { width, height } } = chart;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();
    // Draw "Live Sessions" text
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText('Live Sessions', centerX, centerY - 10); // Slightly above the center
    ctx.restore();

    ctx.save();
    // Draw total number
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(total, centerX, centerY + 10); // Slightly below the center
    ctx.restore();
  }
};

const myChart = new Chart(livectx, {
  type: 'doughnut',
  data: {
    labels: labels, // Add labels to the chart data
    datasets: [{
      data: data,
      backgroundColor: chartColors,
      borderWidth: 0
    }]
  },
  options: {
    cutout: '60%', // Adjust the size of the center hole
    plugins: {
      legend: {
        display: false,
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  },
  plugins: [centerTextLine]
});
}




///////Assessment table chart
// Fetch the data from the table structure
const assessmentLabels = [];
const assessmentData = [];

document.querySelectorAll('.assessment-table tbody tr').forEach(function(row) {
const label = row.querySelector('td:first-child').textContent.trim();
const value = parseFloat(row.querySelector('td:last-child').textContent.trim());
assessmentLabels.push(label);
assessmentData.push(value);
});

const assessmentChartColors = ['#FB923C', '#C084FC', '#CCF6A4'];

const assessmentCtx = document.getElementById('myChart-assessment').getContext('2d');

const labelInsidePlugin = {
id: 'labelInsidePlugin',
afterDatasetsDraw(chart) {
  const { ctx, chartArea: { width, height } } = chart;
  
  // Calculate the center point of the chart area
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Get the total value of the data
  const totalValue = assessmentData.reduce((total, value) => total + value, 0);
  
  ctx.save();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#000';
  ctx.fillText(`Total: ${totalValue}`, centerX, centerY);

  ctx.restore();
}
};

const assessmentChart = new Chart(assessmentCtx, {
type: 'doughnut',
data: {
  labels: assessmentLabels,
  datasets: [{
    data: assessmentData,
    backgroundColor: assessmentChartColors,
    borderWidth: 1
  }]
},
options: {
  cutout: '70%', // Adjust the size of the center hole
  plugins: {
    legend: {
      display: false
    }
  },
  responsive: true,
  maintainAspectRatio: false
},
plugins: [labelInsidePlugin]
});





//overview- emp
const employability_labels = ['10', '11', '12', '13', '14', '15', '16'];
const employability_data = [190, 150, 90, 80, 185, 60, 95]; 
const emp_data2 = [92, 34, 56, 98, 140, 34, 195];// Manual data for demonstration
const employability_color = '#2563EB';
const employability_colors = '#FB923C';

const employability_ctx = document.getElementById('myChart-employability').getContext('2d');
const employability_myChart = new Chart(employability_ctx, {
type: 'bar',
data: {
  labels: employability_labels,
  datasets: [{
    data: employability_data,
    backgroundColor: employability_color,
    borderRadius: Number.MAX_VALUE,
    borderWidth: 0,
    borderSkipped: false,
    barThickness: 15
  },
  {
      data: emp_data2,
      backgroundColor: employability_colors,
      borderRadius: Number.MAX_VALUE,
      borderWidth: 0,
      borderSkipped: false,
      barThickness: 15
    },
]
},
options: {
  scales: {
    y: {
      ticks: {
        beginAtZero: true,
        stepSize: 100, // Step size for y-axis
        max: 400, // Maximum value for y-axis
        // Hide y-axis labels
      },
      grid:{
          display: true
      }
    },
    
    x: {
      barPercentage: 0.5, // Adjust the width of the bars
      categoryPercentage: 1.0, // Adjust the space between the bars
      grid:{
          display: false
      }
    }
  },
  legend: {
    display: false
  },
  responsive: true,
  maintainAspectRatio: false
}
});



  
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
const defaultSection = document.getElementById('daily-test'); // Ensure this matches your default section ID
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
const defaultSection = document.getElementById('sattendance-summary'); // Ensure this ID matches your default section
if (defaultSection) {
  defaultSection.classList.add('active');
} else {
  console.error("No default section found with ID: 'default-section-id'");
}
});
