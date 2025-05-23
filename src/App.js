import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { BrowserRouter as Router, Routes, Route, Navigate,  useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import RedirectToLogin from "./pages/RedirectToLogin";
import IntegratedGroups from "./components/IntegratedGroups";

  function CleanUrlAfterLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("code") || params.has("state")) {
      navigate("/", { replace: true });
    }
  }, [location]);

  return null;
}

function AppContent() {
  const auth = useAuth();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("post_logout") === "true") {
      localStorage.clear();
      window.location.replace("/");
    }
  }, []);

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
      <>
        <CleanUrlAfterLogin />
        <Routes>
          <Route path="/" element={<IntegratedGroups username={name} />} />
          <Route path="/profile" element={<ProfilePage name={name} email={email} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </>
    );
  }

  return <RedirectToLogin />;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
