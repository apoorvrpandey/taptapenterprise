<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>

$(document).ready(function() {
    // Function to retrieve sub domain stats from the server
    function fetchSubDomainStats() {
        $.ajax({
            url: 'api/emp_subdomainaccuracy/sub_domain_stats',
            method: 'GET',
            success: function(data) {
                // Populate Sub Domain Stats Table
                const subDomainStatsTable = $('#subDomainStatsTable tbody');
                subDomainStatsTable.empty();
                data.sub_domain_stats.forEach(stat => {
                    subDomainStatsTable.append(
                        `<tr>
                            <td>${stat.sub_domain}</td>
                            <td>${stat.average_accuracy}</td>
                        </tr>`
                    );
                });

                // Populate Weak Areas List
                const weakAreasList = $('#weakAreasList');
                weakAreasList.empty();
                weakAreasList.append(data.weak_areas.join(', '));

                // Populate Improvement Areas List
                const improvementAreasList = $('#improvementAreasList');
                improvementAreasList.empty();
                improvementAreasList.append(data.improvement_areas.join(', '));

                // Populate Strong Areas List
                const strongAreasList = $('#strongAreasList');
                strongAreasList.empty();
                strongAreasList.append(data.strong_areas.join(', '));
            },
            error: function(error) {
                console.error('Error fetching sub domain stats:', error);
                alert('Failed to fetch sub domain stats.');
            }
        });
    }

    // Fetch sub domain stats when the page loads
    fetchSubDomainStats();
});