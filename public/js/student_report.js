function fetchUserInfo() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  if (!email) {
    console.error("Email parameter is missing in the URL.");
    return;
  }

  fetch("api/student_report_user/user?email=" + encodeURIComponent(email))
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Failed to fetch user information. Status: " + response.status
        );
      }
      return response.json();
    })
    .then((data) => {
        data.image
        ? (document.getElementById('user_image').src = data.image)
        : (document.getElementById('user_image').src = 'img/taptap_logo.png');

      document.getElementById("full-name").textContent = data.full_name;
      document.getElementById("email").textContent = data.email;
      document.getElementById("phone").textContent = data.phone;
      document.getElementById("college-name").textContent = data.college_name;
      document.getElementById("department-name").textContent =
        data.department_name;
      document.getElementById("roll-number").textContent = data.roll_number;
      document.getElementById("roll-number2").textContent = data.roll_number;
    })
    .catch((error) => {
      console.error("Error fetching user information:", error);
    });
}

function fetchAverages() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  if (!email) {
    console.error("Email parameter is missing in the URL.");
    return;
  }

  fetch(
    `api/student_report_scores/averages/?email=${encodeURIComponent(email)}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch averages. Status: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("average-aptitude").textContent =
        data.average_aptitude;
      document.getElementById("average-english").textContent =
        data.average_english;
      document.getElementById("average-coding").textContent =
        data.average_coding;
      document.getElementById("average-score").textContent = data.average_score;
      document.getElementById("num-students-a").textContent =
        data.num_students_by_band.A;
      document.getElementById("num-students-a2").textContent =
        data.num_students_by_band.A;
      document.getElementById("num-students-b").textContent =
        data.num_students_by_band.B;
      document.getElementById("num-students-c").textContent =
        data.num_students_by_band.C;
      document.getElementById("num-students-d").textContent =
        data.num_students_by_band.D;
      document.getElementById("num-students-f").textContent =
        data.num_students_by_band.F;
    })
    .catch((error) => {
      console.error("Error fetching averages:", error);
    });
}

function fetchScores() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  if (!email) {
    console.error("Email parameter is missing in the URL.");
    return;
  }

  fetch(`api/student_report_scores/scores?email=${encodeURIComponent(email)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch scores. Status: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("aptitude").textContent = data.aptitude;
      document.getElementById("english").textContent = data.english;
      document.getElementById("coding").textContent = data.coding;
      document.getElementById("employability-band").textContent =
        data.employability_band;
      document.getElementById("total-score").textContent = data.total_score;
      document.getElementById("comment").textContent = data.comment;
      document.getElementById("aptitude-suggestions").textContent =
        data.aptitude_improvement_suggestions;
      document.getElementById("english-suggestions").textContent =
        data.english_improvement_suggestions;
      document.getElementById("technical-suggestions").textContent =
        data.technical_improvement_suggestions;
    })
    .catch((error) => {
      console.error("Error fetching scores:", error);
    });
}

function fetchScoreDifferences() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  if (!email) {
    console.error("Email parameter is missing in the URL.");
    return;
  }

  fetch(
    `api/student_report_scores/score-differences?email=${encodeURIComponent(
      email
    )}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Failed to fetch score differences. Status: " + response.status
        );
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("difference-aptitude").textContent =
        data.score_differences.aptitude_difference;
      document.getElementById("difference-english").textContent =
        data.score_differences.english_difference;
      document.getElementById("difference-coding").textContent =
        data.score_differences.coding_difference;
      document.getElementById("difference-total-score").textContent =
        data.score_differences.total_score_difference;
    })
    .catch((error) => {
      console.error("Error fetching score differences:", error);
    });
}

// Call the functions to fetch data when the page loads
document.addEventListener("DOMContentLoaded", () => {
  fetchUserInfo();
  fetchAverages();
  fetchScores();
  fetchScoreDifferences();
});
