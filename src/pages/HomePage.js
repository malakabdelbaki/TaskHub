import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import TaskHubLogo from "../TaskHubLogo.svg";
import ProfileIcon from "../ProfileIcon.svg";

function HomePage({ username }) {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <header className="header">
        <div className="logo-container">
          <img src={TaskHubLogo} alt="TaskHub Logo" className="logo" />
        </div>
        <div className="profile-icon" onClick={() => navigate("/profile")}>
          <img src={ProfileIcon} alt="Profile" className="profile-icon-img" />
        </div>

      </header>

        <h1 className="welcome-text">
          Welcome, <span className="username">{username}</span>
        </h1>
    </div>
  );
}

export default HomePage;
