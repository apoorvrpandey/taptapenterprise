"use client";
import React, { useEffect, useState } from 'react';
import '../public/css/nav_log.css'; // Assuming you have a CSS file for styling
import {jwtDecode} from 'jwt-decode'; // Ensure jwt-decode is imported correctly

const Navbar = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [userDetails, setUserDetails] = useState({ email: 'No user logged in', role: '' });
  const [modalVisible, setModalVisible] = useState(false); // State for modal visibility

  useEffect(() => {
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
      const decoded = jwtDecode(token);

      // Display the username and role
      //@ts-ignore
      setUserDetails({ email: decoded?.email || "No user logged in", role: decoded?.role || "" });
    }
  }, []);

  const handleUserButtonClick = () => {
    setLogoutVisible(!logoutVisible);
  };

  const handleLogoutButtonClick = () => {
    setModalVisible(true); // Show the modal
  };

  const handleCancelLogout = () => {
    setModalVisible(false); // Hide the modal
  };

  const handleConfirmLogout = async () => {
    try {
      // Send GET request to /logout
      const response = await fetch('/logout', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any additional headers if needed
        },
      });

      if (response.ok) {
        // Logout successful, redirect to home page
        window.location.href = '/';
      } else {
        // Handle errors if needed
        console.error('Logout failed');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('An error occurred during logout:', error);
    }

    setModalVisible(false); // Hide the modal
  };

  return (
    <div className="navbar" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
      <div className="nav1"></div>

      {modalVisible && ( // Conditionally render the modal
        <div id="logoutModal" className="fixed rounded-md  font-system-ui flex  items-center justify-center top-0  left-0 bg-black bg-opacity-40 w-full z-[20000] h-full">
          <div className="bg-white mx-auto -mt-56 my-4 p-5 border border-gray-400 w-4/5 rounded-xl shadow-md">
            <p className="flex-shrink-0 flex-grow-1 basis-0 px-6 py-6 text-sm font-bold ">Are you sure you want to logout?</p>
            <div className="logout-div"></div>
            <div className="text-right mt-2.5">
              <button className='bg-[#edf2f7] text-sm  text-black font-bold rounded-md py-2 px-4 mx-2 cursor-pointer no-underline' onClick={handleCancelLogout}>Cancel</button>
              <button className='bg-[#88eb4c] text-sm text-black font-bold rounded-md py-2 px-4 mx-2 cursor-pointer no-underline' onClick={handleConfirmLogout} >Yes</button>
            </div>
          </div>
        </div>
      )}

      <div className="nav2 flex items-center">
        <a href="https://admin.hackathon.blackbucks.me/manageStudents/">
          <div className="chakra-stack css-nr8aow">
            <img alt="Manage Users" src="img/newManageUsers.svg" className="chakra-image css-0" />
          </div>
        </a>
        <a href="https://admin.hackathon.blackbucks.me/tpCalendar/" style={{ marginLeft: '1rem' }}>
          <div className="chakra-stack css-nr8aow">
            <img alt="Calendar" src="img/newCalenderNavIcon.svg" className="chakra-image css-0" />
          </div>
        </a>
        <a href="https://admin.hackathon.blackbucks.me/manageNotification/" style={{ marginLeft: '1rem' }}>
          <div className="chakra-stack css-nr8aow">
            <div className="css-1edim3w">
              <img alt="Notifications" src="img/newNotificationIcon.svg" className="chakra-image css-6su6fj" />
              <div className="css-1bac456">
                <div className="css-1rkwksi">1</div>
              </div>
            </div>
          </div>
        </a>
        <button type="button" className="navbtn" id="userButton" onClick={handleUserButtonClick}>
          <span className="user-details">
            <div className="user">
              <span className="user-profile">
                <i className="fa-solid fa-circle-user" style={{ fontSize: '30px' }}></i>
              </span>
              <div className="username">
                <p className="userN">{userDetails.email}</p>
                <p className="userR">{userDetails.role}</p>
              </div>
            </div>
          </span>
          <span className="chakra-button__icon css-1hzyiq5">
            <svg
              viewBox="0 0 16 16"
              height="12px"
              width="12px"
              aria-hidden="true"
              focusable="false"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              color="black"
              className="css-1eamic5 ex0cdmw0"
            >
              <path
                fillRule="evenodd"
                d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
              ></path>
            </svg>
          </span>
        </button>

        <button
          type="button"
          className="logoutbtn"
          id="logoutButton"
          style={{ display: logoutVisible ? 'flex' : 'none', marginTop: "100px", marginLeft: "150px" }}
          onClick={handleLogoutButtonClick}
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Navbar;
