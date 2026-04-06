import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Optimal Health Care App starting...');

window.addEventListener('error', (event) => {
  console.error('Client-side error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (event.reason && event.reason.stack) {
    console.error('Stack trace:', event.reason.stack);
  }
  // Log more details if it's a Firebase error
  if (event.reason && event.reason.code) {
    console.error('Firebase Error Code:', event.reason.code);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
