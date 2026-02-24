import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './i18n/config'; // Initialize i18n
import { initSentry } from './config/sentry';
import { initializeRNNoise } from './utils/rnnoise';
import * as Sentry from '@sentry/react';
import { logger } from './utils/logger';

// Initialize Sentry before React renders
initSentry();

// Global error handlers
window.addEventListener('error', (event) => {
  logger.error('Global error:', event.error);
  if (import.meta.env.PROD) {
    Sentry.captureException(event.error, {
      tags: { errorType: 'unhandled_error' }
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
  if (import.meta.env.PROD) {
    Sentry.captureException(event.reason, {
      tags: { errorType: 'unhandled_rejection' }
    });
  }
});

// Initialize RNNoise AI noise suppression
initializeRNNoise()
  .then(() => {
    // RNNoise AI ready
  })
  .catch((err) => logger.error('⚠️ RNNoise initialization failed:', err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <App />
  </BrowserRouter>
);
