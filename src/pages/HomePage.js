import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import TaskHubLogo from "../TaskHubLogo.svg";

function HomePage({ username }) {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <header className="header">
        <div className="logo-container">
          <img src={TaskHubLogo} alt="TaskHub Logo" className="logo" />
        </div>
        <div className="profile-icon" onClick={() => navigate("/profile")}>
          👤
        </div>
      </header>

      <main className="main-content">
        <h1>
          Welcome, <span className="username">{username}</span>
        </h1>
      </main>
    </div>
  );
}

export default HomePage;
