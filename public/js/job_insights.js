document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch job post data from the server
        const responseJobPostData = await fetch('api/job_insights/job_post_data');
        if (!responseJobPostData.ok) {
            throw new Error(`HTTP error! status: ${responseJobPostData.status}`);
        }
        const jobPostData = await responseJobPostData.json();

        // Get the elements by their IDs
        const totalJobPostsElement = document.getElementById('total-job-posts');
        const averageJobApplicationsPerPostElement = document.getElementById('average-job-applications-per-post');

        // Update the elements with the fetched data
        totalJobPostsElement.textContent = jobPostData.total_published_job_posts ?? '0';

        // Calculate and update the average job applications per post
        if (jobPostData.total_job_applications !== undefined && jobPostData.total_job_applications !== null 
            && jobPostData.total_published_job_posts !== undefined && jobPostData.total_published_job_posts !== null 
            && jobPostData.total_published_job_posts > 0) {
            const averageJobApplicationsPerPost = jobPostData.total_job_applications / jobPostData.total_published_job_posts;
            averageJobApplicationsPerPostElement.textContent = averageJobApplicationsPerPost.toFixed(2);
        } else {
            averageJobApplicationsPerPostElement.textContent = '0';
        }

        // Fetch applied count from the server
        const responseAppliedCount = await fetch('api/job_insights/applied_count');
        if (!responseAppliedCount.ok) {
            throw new Error(`HTTP error! status: ${responseAppliedCount.status}`);
        }
        const appliedCountData = await responseAppliedCount.json();
        const appliedCountElement = document.getElementById('appliedcount');
        appliedCountElement.textContent = appliedCountData.applied_count ?? '0';

        // Fetch job post ratio from the server
        const responseJobPostRatio = await fetch('api/job_insights/job_post_ratio');
        if (!responseJobPostRatio.ok) {
            throw new Error(`HTTP error! status: ${responseJobPostRatio.status}`);
        }
        const jobPostRatioData = await responseJobPostRatio.json();
        const jobPostRatioElement = document.getElementById('job-post-ratio');
        jobPostRatioElement.textContent = jobPostRatioData.ratio?.toFixed(2) ?? '0';

    } catch (error) {
        console.error('Error fetching job post data:', error);
    }
});
