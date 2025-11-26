import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
    const isAuthenticated = () => {
        return localStorage.getItem('adminToken') !== null;
    };

    const PrivateRoute = ({ children }) => {
        return isAuthenticated() ? children : <Navigate to="/" replace />;
    };

    const LoginRoute = () => {
        return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />;
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginRoute />} />
                <Route
                    path="/dashboard/*"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
