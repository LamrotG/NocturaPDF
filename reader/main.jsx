import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register the PWA service worker (production only — dev keeps HMR clean).
// When a new version is deployed, the updated service worker is detected on
// the next visit/launch; we activate it immediately and reload once, so
// installed PWAs pick up updates automatically instead of waiting for the
// user to close every tab or manually reload.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      // A waiting worker means a new version was downloaded but is held back
      // by the old one — activate it right away.
      if (reg.waiting) {
        reg.waiting.postMessage('SKIP_WAITING');
      }

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            installing.postMessage('SKIP_WAITING');
          }
        });
      });

      // The new worker has taken over — reload once so the page runs the new
      // assets. The guard prevents reload loops (e.g. a second controller
      // change in the same session).
      let hasReloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasReloaded) return;
        hasReloaded = true;
        window.location.reload();
      });
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)