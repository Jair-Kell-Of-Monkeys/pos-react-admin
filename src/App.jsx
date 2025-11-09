// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Páginas que SÍ existen
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';  
import Products from './pages/Products/Products';      
import Sales from './pages/Sales/Sales';  

// import Users from './pages/Users';
// import Reports from './pages/Reports/Reports';

import './styles/theme.css';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Login sin protección */}
            <Route path="/login" element={<Login />} />

            {/* Rutas que SÍ funcionan */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/products" element={<Layout><Products /></Layout>} />
            <Route path="/sales" element={<Layout><Sales /></Layout>} />

            {/* COMENTAR estas rutas temporalmente */}
            {/* <Route path="/users" element={<Layout><Users /></Layout>} /> */}
            <Route path="/reports" element={<Layout><Reports /></Layout>} />

            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;