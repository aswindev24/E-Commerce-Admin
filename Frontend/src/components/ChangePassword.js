import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Lock, Shield } from 'lucide-react';
import './ChangePassword.css';

function ChangePassword() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (message.text) {
            setMessage({ type: '', text: '' });
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field]
        });
    };

    const validateForm = () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return false;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return false;
        }

        if (formData.currentPassword === formData.newPassword) {
            setMessage({ type: 'error', text: 'New password must be different from current password' });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to change password' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-wrapper">
            <div className="change-password-container">
                {/* Security Badge */}
                <div className="security-badge">
                    <div className="security-badge-inner">
                        <Shield className="security-badge-icon" />
                        <span className="security-badge-text">Secure Password Update</span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="change-password-card">
                    {/* Header with Gradient */}
                    <div className="card-header">
                        <div className="card-header-content">
                            <div className="header-icon">
                                <Key />
                            </div>
                            <h2>Change Password</h2>
                            <p>Keep your account secure with a strong password</p>
                        </div>
                        {/* Decorative elements */}
                        <div className="decorative-circle-1"></div>
                        <div className="decorative-circle-2"></div>
                    </div>

                    {/* Form Container */}
                    <div className="password-form-container">
                        {/* Message */}
                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.type === 'success' ? (
                                    <CheckCircle />
                                ) : (
                                    <AlertCircle />
                                )}
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* Form */}
                        <div className="password-form">
                            {/* Current Password */}
                            <div className="form-group">
                                <label htmlFor="currentPassword">
                                    <Lock />
                                    Current Password
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        placeholder="Enter your current password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => togglePasswordVisibility('current')}
                                        tabIndex="-1"
                                    >
                                        {showPasswords.current ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="form-group">
                                <label htmlFor="newPassword">
                                    <Lock />
                                    New Password
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        id="newPassword"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Enter new password (min. 6 characters)"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => togglePasswordVisibility('new')}
                                        tabIndex="-1"
                                    >
                                        {showPasswords.new ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group">
                                <label htmlFor="confirmPassword">
                                    <Lock />
                                    Confirm New Password
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your new password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        tabIndex="-1"
                                    >
                                        {showPasswords.confirm ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        <span>Changing Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <Key />
                                        <span>Change Password</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Security Tip */}
                        <div className="security-tip">
                            <div className="security-tip-content">
                                <Shield className="security-tip-icon" />
                                <div>
                                    <h3>Security Tip</h3>
                                    <p>Use a strong password with a mix of letters, numbers, and symbols. Avoid using the same password across multiple sites.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="password-footer">
                    <p>
                        Need help? <a href="#">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;