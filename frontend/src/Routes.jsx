// src/Routes.js
import React from 'react';
import { Route, Routes } from 'react-router-dom'; // Use Routes instead of Switch
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const Routing = () => {
  return (
    <Routes> {/* Use Routes instead of Switch */}
      <Route path="/" element={<HomePage />} /> {/* Use element prop instead of component */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
};

export default Routing;