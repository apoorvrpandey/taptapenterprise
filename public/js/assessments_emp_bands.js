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

    const fetchData = async () => {
        try {
            const response = await fetch('api/emp_band_filters/emp_band_data');
            const data = await response.json();
            populateFilters(data.filters);
            updateData();
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
                checkbox.addEventListener('change', updateData);

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

    const updateData = async () => {
        const degree = getCheckedValues(degreeFilter);
        const branch = getCheckedValues(branchFilter);
        const year = getCheckedValues(yearFilter);

        try {
            const response = await fetch(`api/emp_band_filters/emp_band_data?degree=${degree}&branch=${branch}&year=${year}`);
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
    const bandGrades = ['A++', 'A+', 'A', 'B', 'C','F'];
    const lpaRange=['12+ Lpa','9-12 Lpa','7-9 Lpa','5-7 Lpa','3-5 Lpa','<3 Lpa']
    const suggestiveTrainings=['MERN Stack and Data Structures and Algorithms','Full Stack Development Using Python and DSA','Data Structures and Algorithms','Python and Stutured Query Language','Power BI / Tableau / CRM','Power BI / Tableau / CRM']
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
        bandDescCell.textContent =  lpaRange[index] 

        const trainingsCell = document.createElement('td');
        trainingsCell.textContent = suggestiveTrainings[index]// Static suggestive trainings

        row.appendChild(empBandCell);
        row.appendChild(empCountCell);
        row.appendChild(bestCountCell);
        row.appendChild(bandDescCell);
        row.appendChild(trainingsCell);
        dataTableBody.appendChild(row);
    });
};

    const getBandDescription = (band) => {
    // Add your logic here to return the static band description based on the band
    // Example:
    switch (band) {
        case 'A':
            return '15+ LPA';
        case 'B':
            return '8-15 LPA';
            case 'C':
            return '3-8 LPA';
            case 'D':
            return '2-3 LPA';
            case 'F':
            return 'Unable to Predict';
        // Add more cases as needed
        default:
            return 'Description not available';
    }
};

// Static data for Suggestive Trainings
const getSuggestiveTrainings = (band) => {
    // Add your logic here to return the static suggestive trainings based on the band
    // Example:
    switch (band) {
        case 'A':
            return 'MERN Stack and Data Structures and Algorithms';
        case 'B':
            return 'Full Stack Development Using Python and DSA';
            case 'C':
            return 'Data Structures and Algorithms';
            case 'D':
            return 'Python and Structured Query Language';
            case 'F':
            return 'Power BI / Tableau / CRM';
        // Add more cases as needed
        default:
            return 'Trainings not available';
    }
};


    // Initial data fetch
    fetchData();

});