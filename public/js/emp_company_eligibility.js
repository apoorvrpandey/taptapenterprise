// Function to fetch data from the API and render the chart
function fetchEligibilityDataAndRenderChart() {
    fetch('api/emp_company_eligibiliy/data')
        .then(response => response.json())
        .then(data => {
            console.log("Data received:", data);
            const allIneligible = data.every(item => parseInt(item.eligible_count) === 0);

            // If all are ineligible, hide the section
            if (allIneligible) {
              document.querySelector('.section4').style.display = 'none';
            } else {
              // Process the data for the chart
              const processedData = processEligibilityChartData(data);
      
              // Render the chart with the processed data
              renderEligibilityChart(processedData);
      
              // Ensure the section is visible
              document.querySelector('.section4').style.display = 'block';
            }
          })
          .catch(error => console.error('Error fetching data:', error));
      }

// Function to process the data for the chart
function processEligibilityChartData(data) {
    const labels = data.map(item => item.company_name);
    const eligibleData = data.map(item => parseInt(item.eligible_count));
    const ineligibleData = data.map(item => parseInt(item.ineligible_count));

    return {
        labels: labels,
        datasets: [
            {
                label: 'Ineligible',
                borderRadius: 5,
                backgroundColor: '#F6F4FE' , // Apply pattern to the entire bar
                data: ineligibleData,
                barThickness: 35,
            },
            {
                label: 'Eligible',
                borderWidth: 1,
                borderRadius: 5,
                backgroundColor: getEligibilityPattern(), // Gray
                data: eligibleData,
                barThickness: 35,
            }
        ]
    };
}

// Creating a striped gradient pattern using a specific color
function getEligibilityPattern() {
    const patternCanvas = document.createElement('canvas');
    const patternContext = patternCanvas.getContext('2d');

    patternCanvas.width = 40;
    patternCanvas.height = 400;

    // Create a vertical gradient using #8061DB
    const gradient = patternContext.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#8061DB'); // Top transparent
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)'); // Specific purple color

    patternContext.fillStyle = gradient;
    patternContext.fillRect(0, 0, 40, 400);

    // Add light blue stripes over the gradient
    patternContext.fillStyle = 'rgba(135, 206, 235, 0.3)'; // Light blue color for the stripes
    for (let i = 0; i < 40; i += 4) { // Reduced width of the stripes to 4 pixels
        patternContext.fillRect(i, 0, 2, 400); // Draw narrower stripes
    }

    return patternContext.createPattern(patternCanvas, 'repeat');
}

// Function to render the chart
function renderEligibilityChart(data) {
    const ctx = document.getElementById('myChart2').getContext('2d');

    // Chart configuration
    const config2 = {
        type: 'bar',
        data: data,
        options: {
            layout: {
                padding: {
                    bottom: 20 // Adjust the bottom padding to create space between bars and x-axis
                }
            },
            scales: {
                x: {
                    stacked: true,
                    categorySpacing: 4, // Adjust the spacing between bars
                    grid: {
                       display:false // Make X-axis grid lines dashed
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        display: false // Remove background graph lines on y-axis
                    }
                  
                }
            },
            radius: 25
        },
    };

    // Create the chart
    const myChart2 = new Chart(ctx, config2);
}

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    fetchEligibilityDataAndRenderChart();
});
