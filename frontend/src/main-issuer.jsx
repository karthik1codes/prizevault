import React from 'react'
import ReactDOM from 'react-dom/client'
import IssuerApp from './issuer/IssuerApp'
import '../styles.css'
import './issuer/styles.css'
import './issuer/issuerApp.css'

// Simple render without complex providers for now
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IssuerApp />
  </React.StrictMode>,
)
