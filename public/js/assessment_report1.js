// Function to get assessment ID from URL
function getAssessmentIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function fetchData() {
    const assessmentId = getAssessmentIdFromUrl();

    if (!assessmentId) {
        console.error('Assessment ID not found in URL');
        return;
    }

    fetch(`api/employability_assessments/cards/${assessmentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data fetched successfully:', data);

            // Update DOM elements with fetched data
            document.getElementById('totalParticipants').innerText = data.rows[0].participant_count;
            document.getElementById('totalCollegeCodes').innerText = data.totalCollegeCodes;
            document.getElementById('collegeRank').innerText = data.rows[0].college_rank;
            document.getElementById('average_emp_score').innerText = data.rows[0].test_score;
        })
        .catch(error => console.error('Error fetching data:', error));
}

fetchData();
