// Function to get assessment ID from URL
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

    const languageDataUrl = `api/employability_assessments/language_data/${assessmentId}`;
    const accuracyScoresUrl = `api/employability_assessments/accuracy_scores/${assessmentId}`;

    // Fetch data from both APIs
    Promise.all([
        fetch(languageDataUrl).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }),
        fetch(accuracyScoresUrl).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
    ])
    .then(([languageData, accuracyData]) => {
        const combinedData = combineData(languageData, accuracyData);
        const backgroundColors = [
            '#978FED',
            '#53ACFD',
            '#D3FB52',
            '#EED477',
            '#FF6384', // Add more colors if needed
            '#36A2EB'
        ];
        renderLanguageCards(combinedData, backgroundColors);
        renderCodingLangChart(combinedData, backgroundColors); // Pass background colors to renderCodingLangChart
    })
    .catch(error => console.error('Error fetching data:', error));
});

// Combine the data based on language
function combineData(languageData, accuracyData) {
    const dataMap = {};

    languageData.forEach(item => {
        dataMap[item.language] = {
            language: item.language,
            distinct_users: parseInt(item.distinct_users, 10),
            accuracy_percentage: 'N/A'
        };
    });

    accuracyData.forEach(item => {
        if (dataMap[item.language]) {
            dataMap[item.language].accuracy_percentage = item.accuracy_percentage;
        }
    });

    return Object.values(dataMap);
}


// Render the HTML cards dynamically
// Render the HTML cards dynamically
function renderLanguageCards(data, backgroundColors) {
    const container = document.querySelector('.column2');
    container.innerHTML = ''; // Clear existing content

    const initialCount = 3; // Number of options to show initially
    let visibleCount = 0; // Counter for visible options

    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        const backgroundColor = backgroundColors[index % backgroundColors.length];
        card.innerHTML = `
            <div class="row">
                <div class="circle" style="background-color: ${backgroundColor}"></div>
                <p class="language">${item.language}</p>
                <span class="separator"></span>
                <p class="year">${item.distinct_users}</p>
                <span class="percentage">${item.accuracy_percentage}%</span>
            </div>
        `;
        container.appendChild(card);
        visibleCount++;
        if (visibleCount > initialCount) {
            card.classList.add('hidden'); // Hide additional options initially
        }
    });

    // Show more functionality
    const showMoreButton = document.createElement('button');
    showMoreButton.textContent = 'Show More';
    showMoreButton.style.cssText = 'display: none; border:none; background-color: transparent; margin: 10px; color: #3468b5; font-size: 12px; text-decoration: underline; float:right; cursor:pointer'; // Applying styles

    showMoreButton.addEventListener('click', () => {
        const hiddenCards = container.querySelectorAll('.card.hidden');
        let count = 0;
        hiddenCards.forEach(card => {
            if (count < 2) {
                card.classList.remove('hidden');
                count++;
            }
        });
        if (container.scrollHeight > container.clientHeight) {
            container.scrollTop = container.scrollHeight - container.clientHeight;
        }
        if (container.scrollHeight <= container.clientHeight) {
            showMoreButton.style.display = 'none';
        }
        showLessButton.style.display = 'block';
    });
    

    // Show less functionality
    const showLessButton = document.createElement('button');
    showLessButton.textContent = 'Show Less';
    showLessButton.style.cssText = 'display: none; border:none; background-color: transparent; margin: 10px; color: #3468b5; font-size: 12px; text-decoration: underline; float:right; cursor:pointer'; // Applying styles

    showLessButton.style.display = 'none'; // Initially hide "show less" button
   
    showLessButton.addEventListener('click', () => {
        const allCards = container.querySelectorAll('.card');
        allCards.forEach((card, index) => {
            if (index >= initialCount) {
                card.classList.add('hidden');
            }
        });
        container.scrollTop = 0;
        showMoreButton.style.display = 'block';
        showLessButton.style.display = 'none';
    });
    

    
    container.appendChild(showMoreButton);
    container.appendChild(showLessButton);

    if (data.length > initialCount) {
        showMoreButton.style.display = 'block'; // Show "show more" button if there are more options
    }
}



// Render the Chart.js chart
function renderCodingLangChart(data, backgroundColors) {
    const canvas = document.getElementById('myChart4');
    if (!canvas) {
        console.error('Cannot find canvas element with ID "myChart4"');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Unable to get context for canvas with ID "myChart4"');
        return;
    }
    
    const labels = data.map(item => item.language);
    const distinctUsers = data.map(item => item.distinct_users);

    const guageChartText = {
        id: 'guageChartText',
        afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;

            ctx.save();
            const xcoor = chart.getDatasetMeta(0).data[0].x;
            const ycoor = chart.getDatasetMeta(0).data[0].y;
            const total = chart.data.datasets[0].data.reduce((acc, value) => acc + value, 0); // Calculate total from chart data

            ctx.font = '30px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(total, xcoor, ycoor - 25);
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Have taken the Coding test', xcoor, ycoor);
            ctx.restore();
        }
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'No of Users',
                data: distinctUsers,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                cutout: '90%',
                borderRadius: 20,
                offset: 1,
                circumference: 180,
                rotation: 270, // Use the provided background colors
            }]
        },
        options: {
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true
                }
            }
        },
        plugins: [guageChartText] 
    });
}