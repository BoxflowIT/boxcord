import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initSentry } from './config/sentry';
import { initializeRNNoise } from './utils/rnnoise';

// Initialize Sentry before React renders
initSentry();

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
