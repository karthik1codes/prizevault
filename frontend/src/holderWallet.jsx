import React from 'react'
import ReactDOM from 'react-dom/client'
import '../styles.css'
import './holderWallet.css'
import HolderApp from './holder/HolderApp'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HolderApp />
  </React.StrictMode>,
)

