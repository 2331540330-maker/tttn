import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker, setupInstallPrompt, requestNotificationPermission } from './utils/pwa.js'

// Only initialize PWA features in production
if (import.meta.env.PROD) {
    registerServiceWorker();
    setupInstallPrompt();

    // Request notification permission after a short delay
    setTimeout(() => {
        requestNotificationPermission();
    }, 3000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
