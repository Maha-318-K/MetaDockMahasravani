import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    resource = baseUrl + resource;
  }
  
  return originalFetch(resource, config);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
