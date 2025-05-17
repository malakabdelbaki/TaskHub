import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";

function RedirectToLogin() {
    const auth = useAuth();

    useEffect(() => {
        if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
            auth.signinRedirect();
        }
    }, [auth]);

    return (
        <div className="fullscreen-loader">
            <div className="spinner"></div>
            <p>Redirecting to login...</p>
        </div>
    );
}

export default RedirectToLogin;
