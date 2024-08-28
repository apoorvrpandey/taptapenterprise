function getAssessmentIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

document.addEventListener('DOMContentLoaded', function() {

    const assessmentId = getAssessmentIdFromUrl();

    if (!assessmentId) {
        console.error('Assessment ID not found in URL');
        return;
    }

    // Extract the college code from the URL
    const apiUrl = `api/employability_assessments/marks_section_stats/${assessmentId}`;

    // Fetch data from API using college code from URL
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderStudentPerformanceCharts(data);
        })
        .catch(error => console.error('Error fetching data:', error));
});

function renderStudentPerformanceCharts(data) {
    const ctx1 = document.getElementById('marksDistributionChart').getContext('2d');

    // Sample data for testing purposes
    // Replace this with your actual data structure
    const chartData = {
        labels: ['Total Marks', 'Aptitude', 'English', 'Technical'],
        datasets: [
            {
                label: 'Highest Marks',
                backgroundColor: '#7962BD', // Purple,
                borderWidth: 1,
                data: [
                    data.marks_stats.highest_marks,
                    data.aptitude_stats.highest_marks,
                    data.english_stats.highest_marks,
                    data.technical_stats.highest_marks
                ]
            },
            {
                label: 'Lowest Marks',
                backgroundColor: 'rgba(178, 157, 236, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                data: [
                    data.marks_stats.lowest_marks,
                    data.aptitude_stats.lowest_marks,
                    data.english_stats.lowest_marks,
                    data.technical_stats.lowest_marks
                ]
            },
            {
                label: 'Average Marks',
                backgroundColor: 'rgba(121, 98, 189, 0.5)',
                borderWidth: 1,
                data: [
                    data.marks_stats.average_marks,
                    data.aptitude_stats.average_marks,
                    data.english_stats.average_marks,
                    data.technical_stats.average_marks
                ]
            }
        ]
    };

    // Chart configuration
    const config = {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                
                annotation: {
                    annotations: [{
                        type: 'line',
                        mode: 'vertical',
                        scaleID: 'x',
                        value: 'March',
                        borderColor: 'red',
                        borderWidth: 2,
                        label: {
                            content: 'Today',
                            enabled: true,
                            position: 'top'
                        }
                    }]
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
            interaction: {
                intersect: false,
                mode: 'index'
            }
        },
    };

    // Create the chart
    const myChart = new Chart(ctx1, config);

    document.getElementById('highestTotalMarks').textContent = data.marks_stats.highest_marks;
    document.getElementById('lowestTotalMarks').textContent = data.marks_stats.lowest_marks;
    document.getElementById('averageTotalMarks').textContent = data.marks_stats.average_marks;
}
