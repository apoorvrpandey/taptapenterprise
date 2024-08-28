document.addEventListener('DOMContentLoaded', () => {
    // Function to get the value of a cookie by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Get the JWT token from the cookie
    const token = getCookie('userAdminToken');

    if (token) {
        // Decode the JWT token
        const decoded = jwt_decode(token);

        // Display the username and role
        document.querySelector('.userN').textContent = decoded.email;
        document.querySelector('.userR').textContent = decoded.role;
    } else {
        // Handle the case where the token is not found
        document.querySelector('.userN').textContent = 'No user logged in';
        document.querySelector('.userR').textContent = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const userButton = document.getElementById('userButton');
    const logoutButton = document.getElementById('logoutButton');

    userButton.addEventListener('click', () => {
        if (logoutButton.style.display === 'none') {
            logoutButton.style.display = 'flex';
            logoutButton.style.top = `${userButton.offsetTop + userButton.offsetHeight}px`;
            logoutButton.style.left = `${userButton.offsetLeft}px`;
        } else {
            logoutButton.style.display = 'none';
        }
    });

    logoutButton.addEventListener('click', () => {
        // Add your logout logic here
        console.log('User logged out');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logoutButton');
    const logoutModal = document.getElementById('logoutModal');
    const modalContent = logoutModal.querySelector('.modal-content');
    const confirmLogoutButton = modalContent.querySelector('#confirmLogout');
    const cancelLogoutButton = modalContent.querySelector('#cancelLogout');

    logoutButton.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default behavior of the button

        // Show the modal
        logoutModal.style.display = 'block';

        // Add event listeners to the modal buttons
        confirmLogoutButton.addEventListener('click', function () {
            // If user confirms, navigate to /logout
            window.location.href = '/logout';
            logoutModal.style.display = 'none'; // Hide the modal
        });

        cancelLogoutButton.addEventListener('click', function () {
            // If user cancels, hide the modal
            logoutModal.style.display = 'none';
        });

        // Add event listener to the close span
        closeSpan.addEventListener('click', function () {
            logoutModal.style.display = 'none'; // Hide the modal
        });

        // Add event listener to the modal itself to close when clicked outside
        window.addEventListener('click', function (event) {
            if (event.target === logoutModal) {
                logoutModal.style.display = 'none'; // Hide the modal
            }
        });
    });
});