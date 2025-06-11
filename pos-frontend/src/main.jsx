// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'; // <-- Import AuthProvider
import Modal from 'react-modal'; // <-- Keep if using Modal

// Set App Element for Modal accessibility if using react-modal
Modal.setAppElement('#root');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Router usually outermost */}
      <AuthProvider> {/* <-- AuthProvider wraps App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)