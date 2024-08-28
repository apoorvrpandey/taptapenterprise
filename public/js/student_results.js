async function fetchUserData() {
    try {
        const response = await fetch('api/emp_student_results/user_data');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable(data);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

function getRandomData() {
    return {
        profileScore: `${(Math.random() * 5).toFixed(2)}%`,
        jobApplied: Math.floor(Math.random() * 100) + 1,
    };
}

function populateTable(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear any existing rows

    data.forEach(user => {
        const randomData = getRandomData();
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><a href="/employabilityStudentReport">${user.name}</a></td>
            <td>${user.roll_number}</td>
            <td>${user.end_year}</td>
            <td>${user.branch}</td>
            <td>${user.degree}</td>
            <td>${user.total_score}</td>
            <td>${user.aptitude}</td>
            <td>${user.english}</td>
            <td>${user.coding}</td>
            <td>${user.employability_band}</td>
            <td>${user.possible_employability_band}</td>
            <td>${user.aptitude_improvement_suggestions}</td>
            <td>${user.english_improvement_suggestions}</td>
            <td>${user.technical_improvement_suggestions}</td>
            <td>${user.coding_accuracy}%</td>
            <td>${user.c_accuracy}%</td>
            <td>${user.python_accuracy}%</td>
            <td>${user.java_accuracy}%</td>
            <td><span class="percentage"><i class="fa-solid fa-arrow-trend-up"></i> ${randomData.profileScore}</span></td>
            <td>${randomData.jobApplied}</td>
            <td><a href="${user.github_id}">GitHub</a></td>
            <td><a href="${user.linkedin_id}">LinkedIn</a></td>
            <td><a href="${user.hacker_rank_id}">HackerRank</a></td>
            <td><a href="${user.leet_code_id}">LeetCode</a></td>
            <td>${user.tenth_cgpa}</td>
            <td>${user.twelfth_cgpa}</td>
            <td>${user.btech_cgpa}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

window.onload = fetchUserData;
