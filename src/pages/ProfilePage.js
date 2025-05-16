import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import TaskHubLogo from "../TaskHubLogo.svg";

function ProfilePage({ name, email }) {
  const navigate = useNavigate();

  return (
    <div className="profile-page">
      <header className="header">
        <div className="logo-container">
          <img src={TaskHubLogo} alt="TaskHub Logo" className="logo" />
        </div>
        <div className="profile-icon" onClick={() => navigate("/profile")}>
          👤
        </div>
      </header>

      <main className="main-content">
        <h2>Profile Information</h2>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
      </main>
    </div>
  );
}

export default ProfilePage;
