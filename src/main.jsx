import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initSecurityShield } from './utils/security.js'

// Kích hoạt khiên bảo mật chống F12/Hacker
initSecurityShield();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
