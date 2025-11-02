// src/components/LoginPage.js --- FINAL CORRECTED VERSION ---

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postPublic } from '../utils/api';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await postPublic('/api/auth/login', {
                username: username.trim(),
                password: password,
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                if (onLoginSuccess) onLoginSuccess(data.user);
                navigate('/');
            } else {
                setError(data.error || `Login failed. Status: ${response.status}.`);
            }
        } catch (err) {
            setError('Failed to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-container">
                
                <div className="login-hero-panel">
                    <div className="hero-content">
                        <div className="hero-asterisk">*</div>
                        <h1>Hello<br />Mangesys! 👋</h1>
                        <p>
                            Streamline your member management, track payments, and
                            save tons of time through automation.
                        </p>
                    </div>
                    <footer>© {new Date().getFullYear()} Mangesys. All rights reserved.</footer>
                </div>

                <div className="login-form-panel">
                    <div className="form-content">
                        <h3 className="form-logo"></h3>
                        <h2>Welcome Back!</h2>
                        
                        <form onSubmit={handleSubmit} noValidate>
                            {error && <p className="error-message">{error}</p>}
                            <div className="form-group">
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                    placeholder="Username"
                                    autoComplete="username"
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                />
                            </div>
                            <button type="submit" className="login-button" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login Now'}
                            </button>
                        </form>
                        
                        {/* --- MOVED ALL LINKS TO THE BOTTOM --- */}
                        <div className="form-footer">
                            <p className="forgot-password-link">
                                Forgot password? <a href="#">Click here</a>
                            </p>
                            <p className="register-link">
                                Don't have an account? <Link to="/register">Create a new one.</Link>
                            </p>
                             <div className="public-legal-links">
                                <Link to="/privacy-policy">Privacy Policy</Link> | <Link to="/terms-and-conditions">Terms & Conditions</Link>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;