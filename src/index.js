import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_Eh2seJlBM",
  client_id: "7kp7g3giro4pav3qo9keq36l2l",
  redirect_uri: "https://51.20.32.229",
  response_type: "code",
  loadUserInfo: true,
  scope: "email openid phone profile",
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);