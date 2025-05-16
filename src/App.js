import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "7kp7g3giro4pav3qo9keq36l2l";
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://eu-north-1eh2sejlbm.auth.eu-north-1.amazoncognito.com";

    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
      auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error]);


  if (auth.isLoading) {
    return (
      <div className="fullscreen-loader">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    const name = auth.user?.profile.name || auth.user?.profile.email;
    const email = auth.user?.profile.email;

    return (
      <Router>
        <Routes>
          <Route path="/" element={<HomePage username={name} />} />
          <Route path="/profile" element={<ProfilePage name={name} email={email} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <div className="fullscreen-loader">
      <div className="spinner"></div>
      <p>Redirecting to login...</p>
    </div>
  );
}

export default App;
