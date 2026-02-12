import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'react-oidc-context';
import App from './App';
import './index.css';

// Cognito OIDC configuration
const cognitoAuthConfig = {
  authority: 'https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_SJ3dGBIPY',
  client_id: '6rsp6ebi274j0nlrc6t44p3pu3',
  redirect_uri: `${window.location.origin}/auth/callback`,
  response_type: 'code',
  scope: 'openid email',
  post_logout_redirect_uri: window.location.origin,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
