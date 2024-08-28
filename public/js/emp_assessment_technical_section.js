// Function to fetch data from the API and render the chart
function fetchDataAndRenderChart() {
    const chartSection = document.getElementById('chartSection');
    const noDataMessage = document.getElementById('noDataMessage');
    const canvas = document.getElementById('cylindricalChart');
    const loader = chartSection.querySelector('.loader');

    // Extract ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const apiUrl = `api/emp_assessment_technicalgraph/data/${id}`;

    // Show the loader while fetching data
    loader.classList.remove('hidden');
    chartSection.style.opacity = '0.5';

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log("Data received:", data);

            // Ensure the data is defined and has sub_domain_stats
            if (data && data.sub_domain_stats && data.sub_domain_stats.length > 0) {
                const subDomainStats = data.sub_domain_stats;

                // Process the data for the chart
                const processedData = processChartData(subDomainStats);

                if (processedData.labels.length > 0) {
                    // Render the chart with the processed data
                    renderCylindricalChart(processedData);

                    // Show the canvas and hide the no data message
                    canvas.style.display = 'block';
                    noDataMessage.style.display = 'none';
                    chartSection.style.opacity = '1';
                } else {
                    // Hide the canvas and show the no data message
                    canvas.style.display = 'none';
                    noDataMessage.style.display = 'block';
                    chartSection.style.opacity = '0.5';
                }
            } else {
                console.error('Data structure is not as expected:', data);

                // Hide the canvas and show the no data message
                canvas.style.display = 'none';
                noDataMessage.style.display = 'block';
                chartSection.style.opacity = '0.5';
            }

            // Hide the loader once data is processed
            loader.classList.add('hidden');
        })
        .catch(error => {
            console.error('Error fetching data:', error);

            // Hide the canvas and show the no data message in case of error
            canvas.style.display = 'none';
            noDataMessage.style.display = 'block';
            chartSection.style.opacity = '0.5';

            // Hide the loader in case of an error
            loader.classList.add('hidden');
        });
}

// Function to process the data for the chart
function processChartData(subDomainStats) {
    const filteredStatsArray = subDomainStats.filter(data => parseFloat(data.average_accuracy) > 0);
    const subDomainNames = filteredStatsArray.map(data => data.sub_domain.replace(/"/g, ''));
    const subDomainScores = filteredStatsArray.map(data => parseFloat(data.average_accuracy));
    const emptyData = subDomainScores.map(value => 100 - value);

    return {
        labels: subDomainNames,
        datasets: [{
            label: 'Accuracy',
            data: subDomainScores,
            backgroundColor: 'rgba(121, 98, 189, 0.8)',
            borderColor: 'rgba(121, 98, 189, 1)',
            borderWidth: 0,
            borderRadius: {
                topLeft: 25,
                topRight: 25,
                bottomLeft: 25,
                bottomRight: 25
            },
            borderSkipped: false,
            stack: 'stack1',
            barThickness: 20,
            categoryPercentage: 0.5
        }, {
            label: 'Remaining',
            data: emptyData,
            backgroundColor: 'rgba(0,0,0,0.06)',
            borderColor: 'rgba(128, 128, 128, 1)',
            borderWidth: 0,
            borderRadius: {
                topLeft: 25,
                topRight: 25,
            },
            borderSkipped: false,
            stack: 'stack1',
            barThickness: 20,
            categoryPercentage: 0.5
        }]
    };
}

// Function to render the chart
function renderCylindricalChart(data) {
    const ctx = document.getElementById('cylindricalChart').getContext('2d');
    const config = {
        type: 'bar',
        data: data,
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        filter: function(labelItem) {
                            // Hide the 'Remaining' dataset from the legend
                            return labelItem.text !== 'Remaining';
                        },
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        fontSize: 12 // Specify the font size here
                    }
                },
                cylindrical: {
                    visible: true,
                    extensionPercentage: 0.2,
                    shadowOffset: 2,
                    shadowBlur: 4,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            animation: {
                duration: 0
            },
            scales: {
                x: {
                    stacked: true,
                    display: true,
                    grid: {
                        display: false,
                        drawTicks: false,
                        drawBorder: false
                    },
                },
                y: {
                    display: false,
                    ticks: {
                        stepSize: 50 // Set the step size for the y-axis labels
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    };

    new Chart(ctx, config);
}

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    fetchDataAndRenderChart();
});
