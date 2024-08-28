let collegesData = []; // Variable to store the list of colleges
        let universityData = []; // Variable to store the list of universities

        // Function to load colleges data when the page loads
        async function loadCollegesData() {
            try {
                const response = await fetch('/api/colleges_list/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch colleges');
                }
                collegesData = await response.json();
            } catch (error) {
                console.error('Error fetching colleges:', error);
                collegesData = []; // Reset to empty array
            }
        }

        // Function to load universities data when the page loads
        async function loadUniversityData() {
            try {
                const response = await fetch('/api/univ_list/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch universities');
                }
                universityData = await response.json();
            } catch (error) {
                console.error('Error fetching universities:', error);
                universityData = []; // Reset to empty array
            }
        }

        // Call loadCollegesData and loadUniversityData functions when the page loads
        window.onload = function() {
            loadCollegesData();
            loadUniversityData();
        };

        // Function to search for colleges based on user input
       // Function to search for colleges based on user input
// Function to search for colleges based on user input
function searchColleges() {
    const keyword = document.getElementById('collegeInput').value.trim().toLowerCase();
    const collegeDropdown = document.getElementById('collegeDropdown');
    collegeDropdown.innerHTML = ''; // Clear previous results

    if (!keyword) {
        collegeDropdown.classList.remove('show'); // Hide dropdown if no keyword
        return;
    }

    // Filter colleges based on the keyword
    const filteredColleges = collegesData.filter(college => {
        const collegeName = college.collegeName.toLowerCase();
        return collegeName.includes(keyword);
    });

    // Populate dropdown with filtered colleges
    filteredColleges.forEach(college => {
        const option = document.createElement('div');
        option.textContent = college.collegeName;
        option.classList.add('hover-option');
        option.onclick = function() {
            console.log('Selected college name:', college.collegeName);
            console.log('Selected college ID:', college.collegeID);

            // Set input field value and selected college ID
            document.getElementById('collegeInput').value = this.textContent;
            document.getElementById('selectedCollegeId').value = college.collegeID;

            // Hide the dropdown
            collegeDropdown.innerHTML = ''; // Clear dropdown content
            collegeDropdown.classList.remove('show'); // Hide the dropdown
        };
        collegeDropdown.appendChild(option);
    });

    // Show dropdown if there are matching colleges
    collegeDropdown.classList.toggle('show', filteredColleges.length > 0);
}

// Function to search for universities based on user input
function searchUniversities() {
    const keyword = document.getElementById('universityInput').value.trim().toLowerCase();
    const universityDropdown = document.getElementById('universityDropdown');
    universityDropdown.innerHTML = ''; // Clear previous results

    if (!keyword) {
        universityDropdown.classList.remove('show'); // Hide dropdown if no keyword
        return;
    }

    // Filter universities based on the keyword
    const filteredUniversities = universityData.filter(university => {
        const universityName = university.universityName.toLowerCase();
        return universityName.includes(keyword);
    });

    // Populate dropdown with filtered universities
    filteredUniversities.forEach(university => {
        const option = document.createElement('div');
        option.textContent = university.universityName;

        option.classList.add('hover-option');

        option.onclick = function() {
            console.log('Selected university name:', university.universityName);
            console.log('Selected university ID:', university.universityID);

            // Set input field value and selected university ID
            document.getElementById('universityInput').value = this.textContent;
            document.getElementById('selectedUniversityId').value = university.universityID;

            // Hide the dropdown
            universityDropdown.innerHTML = ''; // Clear dropdown content
            universityDropdown.classList.remove('show'); // Hide the dropdown
        };
        universityDropdown.appendChild(option);
    });

    // Show dropdown if there are matching universities
    universityDropdown.classList.toggle('show', filteredUniversities.length > 0);
}