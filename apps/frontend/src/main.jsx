import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { ToastProvider } from './context/ToastContext'
import { FleetProvider } from './context/FleetContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <FleetProvider>
        <App />
      </FleetProvider>
    </ToastProvider>
  </BrowserRouter>,
)
