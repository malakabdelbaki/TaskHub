import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import "./App.css";

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
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Welcome {auth.user?.profile.email}</h1>

        {process.env.NODE_ENV === "development" && (
          <div style={{ marginTop: "1rem", background: "#f4f4f4", padding: "1rem", fontSize: "0.9rem" }}>
            <pre>ID Token: {auth.user?.id_token}</pre>
            <pre>Access Token: {auth.user?.access_token}</pre>
            <pre>Refresh Token: {auth.user?.refresh_token}</pre>
          </div>
        )}

        <button onClick={() => auth.removeUser()}>Sign out</button>
      </div>
    );
  }


  return (
    <div className="redirecting-screen">
      <div className="spinner"></div>
      <p>Redirecting to login...</p>
    </div>
  );
}

export default App;
