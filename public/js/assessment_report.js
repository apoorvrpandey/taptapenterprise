document.addEventListener('DOMContentLoaded', function () {
    // Function to retrieve the ID from the URL
    function getIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Function to retrieve sub domain stats from the server
    function fetchSubDomainStats() {
        console.log('Fetching sub domain stats...');
        const id = getIdFromUrl();

        if (!id) {
            console.error('No ID found in the URL');
            alert('No ID found in the URL');
            return;
        }

        fetch(`api/emp_assessment_subdomainaccuracy/sub_domain_stats/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Data fetched successfully:', data);

                // Populate Weak Areas Text
                const weakAreasText = document.getElementById('weakAreasText');
                populateText(weakAreasText, data.weak_areas, 'toggleWeakAreasBtn', 'There are no weak areas');

                // Populate Strong Areas Text
                const strongAreasText = document.getElementById('strongAreasText');
                populateText(strongAreasText, data.strong_areas, 'toggleStrongAreasBtn', 'There are no strong areas');

                // Populate Improvement Areas Text (if needed)
                const improvementAreasText = document.getElementById('improvementAreasText');
                if (improvementAreasText) {
                    populateText(improvementAreasText, data.improvement_areas, 'toggleImprovementAreasBtn', 'There are no improvement areas');
                }
            })
            .catch(error => {
                console.error('Error fetching sub domain stats:', error);
                alert('Failed to fetch sub domain stats.');
            });
    }

    // Function to populate text and handle showing only 6 items initially
    function populateText(textElement, items, buttonId, noDataMessage) {
        if (items.length === 0) {
            textElement.textContent = noDataMessage;
            return;
        }

        // Remove quotes from each item
        const cleanedItems = items.map(item => item.replace(/"/g, ''));
        const initialItems = cleanedItems.slice(0, 6).join(', ');
        const remainingItems = cleanedItems.slice(6).join(', ');

        textElement.textContent = initialItems;
        textElement.dataset.fullText = initialItems + (remainingItems ? ', ' + remainingItems : '');
        textElement.dataset.initialText = initialItems;

        const button = document.getElementById(buttonId);
        if (cleanedItems.length > 6) {
            button.style.display = 'inline';
        } else {
            button.style.display = 'none';
        }
    }

    // Toggle function to show/hide full text
    window.toggleText = function (textId, buttonId) {
        const textElement = document.getElementById(textId);
        const buttonElement = document.getElementById(buttonId);
        const isExpanded = textElement.classList.toggle('expanded');

        if (isExpanded) {
            textElement.textContent = textElement.dataset.fullText;
            buttonElement.textContent = 'Show Less';
        } else {
            textElement.textContent = textElement.dataset.initialText;
            buttonElement.textContent = 'Show More';
        }
    }

    // Fetch sub domain stats when the page loads
    fetchSubDomainStats();
});




let currentData = [];
let isShowingAll = false;
const rowsToShow = 6;

// Function to get hackathon_id from the URL or another source
function getHackathonId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Fetch sub-domain counts and populate the table
async function fetchSubDomainCounts() {
    const hackathonId = getHackathonId();
    const response = await fetch(`/api/emp_assessment_technicalsection/student-counts/${hackathonId}`);
    const data = await response.json();
    currentData = data;
    displayRows();
    if (currentData.length > rowsToShow) {
        document.getElementById('toggleRowsBtn').style.display = 'block';
    }
}

// Display rows in the table based on current data and whether all rows should be shown
function displayRows() {
    const tbody = document.querySelector('#subDomainTable tbody');
    tbody.innerHTML = '';
    const rows = isShowingAll ? currentData : currentData.slice(0, rowsToShow);
    rows.forEach(row => {
        const tr = document.createElement('tr');
        const tdSubDomain = document.createElement('td');
        tdSubDomain.textContent = row.sub_domain;
        const tdCount = document.createElement('td');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = row.count_of_students;
        link.addEventListener('click', () => fetchStudents(row.sub_domain));
        tdCount.appendChild(link);
        tr.appendChild(tdSubDomain);
        tr.appendChild(tdCount);
        tbody.appendChild(tr);
    });
    document.getElementById('toggleRowsBtn').textContent = isShowingAll ? 'Show Less' : 'Show More';
}

// Toggle showing all rows or limited rows
document.getElementById('toggleRowsBtn').addEventListener('click', () => {
    isShowingAll = !isShowingAll;
    displayRows();
});

// Fetch students for a specific sub-domain and populate the student table
async function fetchStudents(sub_domain) {
    const hackathonId = getHackathonId();
    const response = await fetch(`/api/emp_assessment_technicalsection/students/${sub_domain}/${hackathonId}`);
    const data = await response.json();
    const studentTableBody = document.querySelector('#studentTable tbody');
    const subDomainTitle = document.getElementById('subDomainTitle');
    subDomainTitle.textContent = sub_domain;
    studentTableBody.innerHTML = '';
    data.forEach(student => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = student.name;
        const tdEmail = document.createElement('td');
        tdEmail.textContent = student.email;
        const tdTotalScore = document.createElement('td');
        tdTotalScore.textContent = student.coding ? student.coding : 'Not Attempted';
        const tdEmpScore = document.createElement('td');
        tdEmpScore.textContent = student.total_score ? student.total_score : 'Not Attempted';
        const tdEmpband = document.createElement('td');
        tdEmpband.textContent = student.employability_band;
        tr.appendChild(tdName);
        tr.appendChild(tdEmail);
        tr.appendChild(tdTotalScore);
        tr.appendChild(tdEmpScore);
        tr.appendChild(tdEmpband);
        studentTableBody.appendChild(tr);
    });
    const modal = document.getElementById('studentModal');
    modal.style.display = 'block';
}

// Modal handling
const modal = document.getElementById('studentModal');
const span = document.getElementsByClassName('close')[0];

span.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Fetch sub-domain counts on page load
fetchSubDomainCounts();

// Function to add loaders to specified sections
function addLoadersToSections(sectionIds) {
    sectionIds.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            const loader = document.createElement('div');
            loader.className = 'loader';
            section.appendChild(loader);
        }
    });

    // Remove loaders after a certain time (optional)
    window.addEventListener('load', function() {
        setTimeout(function() {
            sectionIds.forEach(id => {
                const section = document.getElementById(id);
                if (section) {
                    const loader = section.querySelector('.loader');
                    if (loader) {
                        loader.style.display = 'none';
                    }
                }
            });
        }, 3000); // Adjust the timeout duration as needed
    });
}

// IDs of the sections where loaders will be added
const sectionIds = ['totalParticipants', 'average_emp_score', 'zero_scorers', 'marksDistributionChart', 'myChart4', 'highestTotalMarks', 'lowestTotalMarks', 'averageTotalMarks', 'degree-filter', 'branch-filter', 'year-filter', 'subDomainTable', 'cylindricalChart', 'data-table', 'weakAreasText', 'strongAreasText'];

// Call the function to add loaders to the sections
addLoadersToSections(sectionIds);







                document.addEventListener('DOMContentLoaded', () => {
    const degreeFilter = document.getElementById('degree-filter');
    const branchFilter = document.getElementById('branch-filter');
    const yearFilter = document.getElementById('year-filter');

    const dataTableBody = document.getElementById('data-table').querySelector('tbody');

    const showMoreDegrees = document.getElementById('show-more-degrees');
    const showLessDegrees = document.getElementById('show-less-degrees');

    const showMoreBranches = document.getElementById('show-more-branches');
    const showLessBranches = document.getElementById('show-less-branches');

    const showMoreYears = document.getElementById('show-more-years');
    const showLessYears = document.getElementById('show-less-years');

    const getHackathonIdFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    };

    const fetchData = async (hackathonId) => {
        try {
            const response = await fetch(`api/employability_assessments/emp_band_data/${hackathonId}`);
            const data = await response.json();
            populateFilters(data.filters);
            updateData(hackathonId);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const populateFilters = (filters) => {
        populateFilter(degreeFilter, filters.degrees, 'degree', showMoreDegrees, showLessDegrees);
        populateFilter(branchFilter, filters.branches, 'branch', showMoreBranches, showLessBranches);
        populateFilter(yearFilter, filters.years, 'year', showMoreYears, showLessYears);
    };

    const populateFilter = (filterElement, options, filterName, showMoreButton, showLessButton) => {
        filterElement.innerHTML = '';
        options.forEach((option, index) => {
            if (option) { // Check if the option is not null or empty
                const div = document.createElement('div');
                div.className = 'checkbox-item';
                if (index >= 2) div.classList.add('hidden');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = option;
                checkbox.name = filterElement.id;
                checkbox.id = `${filterName}-${option}`;
                checkbox.addEventListener('change', () => updateData(getHackathonIdFromUrl()));

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = option;

                div.appendChild(checkbox);
                div.appendChild(label);
                filterElement.appendChild(div);
            }
        });

        showMoreButton.addEventListener('click', () => {
            showMoreButton.classList.add('hidden');
            showLessButton.classList.remove('hidden');
            filterElement.parentNode.classList.add('expanded');
            toggleFilterVisibility(filterElement, true);
        });

        showLessButton.addEventListener('click', () => {
            showLessButton.classList.add('hidden');
            showMoreButton.classList.remove('hidden');
            filterElement.parentNode.classList.remove('expanded');
            toggleFilterVisibility(filterElement, false);
        });
    };

    const toggleFilterVisibility = (filterElement, showAll) => {
        const items = filterElement.querySelectorAll('.checkbox-item');
        items.forEach((item, index) => {
            if (index >= 2) {
                item.classList.toggle('hidden', !showAll);
            }
        });
    };

    const updateData = async (hackathonId) => {
        const degree = getCheckedValues(degreeFilter);
        const branch = getCheckedValues(branchFilter);
        const year = getCheckedValues(yearFilter);

        try {
            const response = await fetch(`api/employability_assessments/emp_band_data/${hackathonId}?degree=${degree}&branch=${branch}&year=${year}`);
            const data = await response.json();
            updateTable(data.emp_band_counts, data.best_band_counts);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const getCheckedValues = (filterElement) => {
        const checkedValues = Array.from(filterElement.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        return checkedValues.join(',');
    };

    const updateTable = (empBandCounts, bestBandCounts) => {
        dataTableBody.innerHTML = '';
        const bandGrades = ['A++', 'A+', 'A', 'B', 'C', 'F'];
        const lpaRange = ['12+ Lpa', '9-12 Lpa', '7-9 Lpa', '5-7 Lpa', '3-5 Lpa', '<3 Lpa'];
        const suggestiveTrainings = [
            'MERN Stack and Data Structures and Algorithms', 
            'Full Stack Development Using Python and DSA', 
            'Data Structures and Algorithms', 
            'Python and Structured Query Language', 
            'Power BI / Tableau / CRM', 
            'Power BI / Tableau / CRM'
        ];

        Object.keys(empBandCounts).forEach((band, index) => {
            const row = document.createElement('tr');
            const empBandCell = document.createElement('td');
            empBandCell.textContent = bandGrades[index] || band;
            empBandCell.style.fontWeight = 'bold'; // Make bandGrades bold

            const empCountCell = document.createElement('td');
            empCountCell.textContent = empBandCounts[band];

            const bestCountCell = document.createElement('td');
            bestCountCell.textContent = bestBandCounts[band];

            const bandDescCell = document.createElement('td');
            bandDescCell.textContent = lpaRange[index];

            const trainingsCell = document.createElement('td');
            trainingsCell.textContent = suggestiveTrainings[index]; // Static suggestive trainings

            row.appendChild(empBandCell);
            row.appendChild(empCountCell);
            row.appendChild(bestCountCell);
            row.appendChild(bandDescCell);
            row.appendChild(trainingsCell);
            dataTableBody.appendChild(row);
        });
    };

    // Initial data fetch
    const hackathonId = getHackathonIdFromUrl();
    if (hackathonId) {
        fetchData(hackathonId);
    } else {
        console.error('Hackathon ID not found in URL.');
    }
});

            