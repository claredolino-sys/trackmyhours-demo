import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ActivityProvider } from './contexts/ActivityContext';

// Suppress unhandled WebSocket errors from Supabase Realtime to prevent app crashes
// This ensures data saving (which uses HTTP) continues to work even if Realtime fails
const suppressWebSocketErrors = (reason: any) => {
  if (reason === 'WebSocket closed without opened' || 
      (typeof reason === 'object' && reason?.message === 'WebSocket closed without opened') ||
      (typeof reason === 'string' && reason.includes('WebSocket')) ||
      (typeof reason?.message === 'string' && reason.message.includes('WebSocket'))) {
    return true;
  }
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  if (suppressWebSocketErrors(event.reason)) {
    event.preventDefault();
    // Silently suppress - no console warning to avoid user confusion
    // Data saving via HTTP is unaffected
  }
});

window.addEventListener('error', (event) => {
  if (suppressWebSocketErrors(event.error)) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ActivityProvider>
      <App />
    </ActivityProvider>
  </React.StrictMode>
);