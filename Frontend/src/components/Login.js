import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { authAPI } from '../services/api';
import './Login.css';
import logo from '../assets/logo.png';

function Login() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const navigate = useNavigate();

    // Clear any existing credentials when component mounts
    useEffect(() => {
        setCredentials({ username: '', password: '' });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(credentials);
            if (response.data.success) {
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        border: 'none',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.3)',
        borderRadius: '0',
        backgroundColor: 'transparent',
        color: isDark ? 'white' : '#333',
        outline: 'none',
        boxShadow: 'none',
        padding: '12px 0',
        width: '100%',
        fontSize: '1rem',
        transition: 'all 0.3s ease'
    };

    return (
        <div className="login-container" style={{ backgroundColor: isDark ? '#002b36' : '#f5f5f5', color: isDark ? 'white' : '#333' }}>
            {/* Left Side - Branding */}
            <div className="login-left">
                <div className="brand-container">
                    <div className="brand-logo">
                        <img src={logo} alt="Brand Logo" style={{ width: '50px', height: '50px', marginTop: '.9rem' }} />
                    </div>
                    <h1 className="brand-text" style={{ color: isDark ? 'white' : '#002b36' }}>
                        LESTORA.
                    </h1>
                </div>
            </div>

            {/* Vertical Divider */}
            <div className="login-divider" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}></div>

            {/* Right Side - Login Form */}
            <div className="login-right">
                <div className="login-form-container">
                    <h2 className="welcome-text" style={{ color: isDark ? 'white' : '#002b36' }}>Welcome</h2>
                    <p className="sub-text" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>
                        PLEASE LOGIN TO ADMIN DASHBOARD.
                    </p>

                    {error && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} autoComplete="off">
                        <div className="form-groupLine">
                            <input
                                type="text"
                                className={`login-input ${!isDark ? 'light' : ''}`}
                                placeholder="USERNAME"
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                required
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderBottom = '2px solid #f26522'}
                                onBlur={(e) => e.target.style.borderBottom = isDark ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.3)'}
                                autoComplete="new-username"
                                id="username-login"
                            />
                        </div>

                        <div className="form-groupLine">
                            <input
                                type="password"
                                className={`login-input ${!isDark ? 'light' : ''}`}
                                placeholder="PASSWORD"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                required
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderBottom = '2px solid #f26522'}
                                onBlur={(e) => e.target.style.borderBottom = isDark ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.3)'}
                                autoComplete="new-password"
                                id="password-login"
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'LOGGING IN...' : 'LOGIN'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Theme Toggle */}
            <button
                className="theme-toggle"
                onClick={() => setIsDark(!isDark)}
                style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: isDark ? 'white' : '#333'
                }}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
    );
}

export default Login;