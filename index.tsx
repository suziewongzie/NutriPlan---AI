import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Application starting...');

// Global Error Handler for Blank Screen Debugging
window.addEventListener('error', (event) => {
  console.error("Global Error Caught:", event.error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #ef4444; background: #fef2f2; height: 100vh;">
        <h1 style="font-size: 24px; margin-bottom: 10px;">Application Crashed</h1>
        <p><strong>Error:</strong> ${event.message}</p>
        <p style="font-size: 12px; color: #991b1b; margin-top: 20px;">Check the browser console for more details.</p>
        <button onclick="window.location.reload()" style="margin-top:20px; padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload</button>
      </div>
    `;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('Application mounted.');