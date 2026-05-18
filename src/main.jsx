import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import App from "./App.jsx";
import "./index.css";
import { awsConfig } from "./config";

const cognitoAuthConfig = {
  authority: `https://cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.userPoolId}`,
  client_id: awsConfig.clientId,
  redirect_uri: awsConfig.redirectUri,
  post_logout_redirect_uri: awsConfig.logoutUri,
  response_type: "code",
  scope: "openid email phone",
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
