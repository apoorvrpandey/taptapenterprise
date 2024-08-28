
document.addEventListener('DOMContentLoaded', () => {
    const jobPostsContainer = document.getElementById('job-posts-container');

    // Function to create a job post element
    function createJobPostElement(jobPost) {
        const jobPostElement = document.createElement('div');
        jobPostElement.className = 'job';
        jobPostElement.setAttribute('onclick', `updateJobDescription('${jobPost.job_post_title}', '${jobPost.company_title}', '${jobPost.description}')`);

        jobPostElement.innerHTML = `
            <img src="${jobPost.job_post_logo_url}" alt="${jobPost.company_title} logo">
            <div class="job-info">
                <h2>${jobPost.job_post_title}</h2> 
                <p>${jobPost.company_title}</p>
                <ul class="details-list">
                    <li><i class="fa-solid fa-indian-rupee-sign" style="color: #000000;"></i> ${jobPost.salary_range_or_not_disclosed}</li>
                    <li><i class="fa-regular fa-clock" style="color: #000000;"></i> ${jobPost.employment_type}</li>
                    <li><i class="fa-regular fa-building" style="color: #000000;"></i> ${jobPost.office_mode}</li>
                    <li><i class="fa-regular fa-user" style="color: #000000;"></i> Drive Count: ${jobPost.drive_count}</li>
                </ul>
            </div>
        `;

        return jobPostElement;
    }

    // Function to fetch and display job posts
    async function fetchAndDisplayJobPosts() {
        try {
            const response = await fetch('api/job_posts/job_posts');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const jobPosts = await response.json();

            // Clear existing job posts
            jobPostsContainer.innerHTML = '';

            // Add job posts to the container
            jobPosts.forEach(jobPost => {
                const jobPostElement = createJobPostElement(jobPost);
                jobPostsContainer.appendChild(jobPostElement);
            });
        } catch (error) {
            console.error('Failed to fetch job posts:', error);
            jobPostsContainer.innerHTML = '<p>Failed to load job posts. Please try again later.</p>';
        }
    }

    // Fetch and display job posts on page load
    fetchAndDisplayJobPosts();
});

function updateJobDescription(title, company, description) {
    const jobDescription = document.querySelector('.job-description');
    const body = document.querySelector('body'); // Select the body element

    // Toggle a class on the body to freeze scrolling
    body.classList.toggle('freeze-scroll');

    // Update job description content
    jobDescription.innerHTML = `
        <div class="common-buttons" style="display: flex;flex-direction: row;">
            <button class="view-applications">View Applications</button>
           
        </div>
        <h2>${title}</h2>
        <p><strong>Company:</strong> ${company}</p>
        <p>${description}</p>
        <div class="close-button" onclick="closeJobDescription()">X</div>
    `;
    
    // Show job description container
    jobDescription.style.display = 'block';
}

function closeJobDescription() {
    const jobDescription = document.querySelector('.job-description');
    const body = document.querySelector('body'); // Select the body element

    // Check if the screen width is less than or equal to 768px (mobile version)
    if (window.innerWidth <= 768) {
        // Remove the class to unfreeze scrolling
        body.classList.remove('freeze-scroll');

        // Hide job description container
        jobDescription.style.display = 'none';
    }
}
