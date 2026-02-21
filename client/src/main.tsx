import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './i18n/config'; // Initialize i18n
import { initSentry } from './config/sentry';
import { initializeRNNoise } from './utils/rnnoise';
import * as Sentry from '@sentry/react';

// Initialize Sentry before React renders
initSentry();

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (import.meta.env.PROD) {
    Sentry.captureException(event.error, {
      tags: { errorType: 'unhandled_error' }
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (import.meta.env.PROD) {
    Sentry.captureException(event.reason, {
      tags: { errorType: 'unhandled_rejection' }
    });
  }
});

// Initialize RNNoise AI noise suppression
initializeRNNoise()
  .then(() => console.log('✅ RNNoise AI ready'))
  .catch((err) => console.error('⚠️ RNNoise initialization failed:', err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <App />
  </BrowserRouter>
);
