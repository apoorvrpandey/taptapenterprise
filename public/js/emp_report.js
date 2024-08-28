// Sample data
const data = {
    labels: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'],
    datasets: [
      {
        label: 'Highest Marks',
        backgroundColor: '#7962BD', // Purple
        data: [20, 25, 85, 50]
      },
      {
        label: 'Average Marks',
        backgroundColor: 'rgba(178, 157, 236, 0.2)', // Deep Purple
        data: [25, 80, 20, 85]
      },
      {
        label: 'Lowest Marks',
        backgroundColor: 'rgba(121, 98, 189, 0.5)', // Indigo
        data: [60, 25, 55, 22]
      }
    ]
  };
  
  // Calculate total marks for each unit
  const totals = data.labels.map((_, index) => {
    return data.datasets.reduce((acc, dataset) => acc + dataset.data[index], 0);
  });
  
  // Chart configuration
  const config = {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Bar Chart'
        }
      },
      scales: {
        x: {
          stacked: false,
          grid: {
            display: false // Remove background graph lines on x-axis
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: false // Remove background graph lines on y-axis
          }
        }
      },
      animation: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      tooltips: {
        enabled: false
      },
      hover: {
        mode: null
      },
      plugins: {
        annotation: {
          drawTime: 'afterDatasetsDraw',
          annotations: [{
            id: 'text-canvas',
            type: 'drawTime',
            events: ['draw'],
            x: 0,
            y: 0,
            drawTime: 'afterDatasetsDraw',
            // Define annotation drawing area
            ctx: 'chart.ctx',
            // Draw method
            draw: function(context) {
              // Loop through each dataset
              data.datasets.forEach((dataset, i) => {
                const meta = context.chart.getDatasetMeta(i);
                
                // Loop through each bar in the dataset
                meta.data.forEach((bar, index) => {
                  const dataValue = dataset.data[index];
                  const percent = ((dataValue / totals[index]) * 100).toFixed(1);
                  const xOffset = bar.width / 2;
                  const yOffset = 5; // Adjust the vertical position of the number
                  const padding = 2; // Padding between bar and number
                  const yPos = bar.y - yOffset;
                  const xPos = bar.x + xOffset;
                  context.font = '12px Arial'; // Set font size and family
                  context.fillStyle = 'black'; // Set font color
                  context.textAlign = 'center'; // Align text to center
                  // Display data value and percentage on top of the bar
                  context.fillText(`${dataValue} (${percent}%)`, xPos, yPos);
                });
              });
            }
          }]
        }
      }
    },
  };
  
  // Create the chart
  const myChart = new Chart(
    document.getElementById('myChart'),
    config
  );
  
  
  