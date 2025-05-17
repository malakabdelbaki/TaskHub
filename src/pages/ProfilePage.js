import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import TaskHubLogo from "../icons/TaskHubLogo.svg";
import ProfileIcon from "../icons/ProfileIcon.svg";
import ProfileIconUser from "../icons/ProfileIconUser.svg";
import EmailIcon from "../icons/EmailIcon.svg";

function ProfilePage({ name, email }) {
  const navigate = useNavigate();

  const signOutRedirect = () => {
    const clientId = "7kp7g3giro4pav3qo9keq36l2l";
    const logoutUri = "http://localhost:3000?post_logout=true";
    const cognitoDomain = "https://eu-north-1eh2sejlbm.auth.eu-north-1.amazoncognito.com";

    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <div className="profile-page">
      <header className="header">
        <div className="logo-container">
          <img src={TaskHubLogo} alt="TaskHub Logo" className="logo" />
        </div>
        <div className="profile-icon" onClick={() => navigate("/profile")}>
          <img src={ProfileIcon} alt="Profile" className="profile-icon-img" />
        </div>
      </header>

      <main className="main-content">
        <h1 className="profile-title">Your Profile</h1>
        <div className="profile-card">
          <div className="profile-field">
            <label>Username</label>
            <div className="input-box">
              <img src={ProfileIconUser} alt="User Icon" className="input-icon" />
              <span>{name}</span>
            </div>
          </div>
          <div className="profile-field">
            <label>Email Address</label>
            <div className="input-box">
              <img src={EmailIcon} alt="Email Icon" className="input-icon" />
              <span>{email}</span>
            </div>
          </div>
        </div>
        <button className="signout-btn" onClick={signOutRedirect}>
          Sign out
        </button>
      </main>
    </div>
  );
}

export default ProfilePage;
