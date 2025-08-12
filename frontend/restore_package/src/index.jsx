import React from 'react';
import ReactDOM from 'react-dom/client';  // Notice the import from 'react-dom/client'
import App from './App';
import './index.css';  // If you have custom styles
import 'bootstrap-icons/font/bootstrap-icons.css';

const root = ReactDOM.createRoot(document.getElementById('root'));  // Create the root element

root.render(
  <React.StrictMode>
    <App />
    
  </React.StrictMode>
);
