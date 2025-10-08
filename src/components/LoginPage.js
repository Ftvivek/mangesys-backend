// src/components/LoginPage.js

import React, { useState, useEffect } from 'react'; // <-- IMPORT useEffect
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shouldRedirect, setShouldRedirect] = useState(false); // <-- NEW: State for redirection
    const navigate = useNavigate();

    // --- NEW: useEffect hook to handle the redirect ---
    useEffect(() => {
        // If the redirect flag is set to true...
        if (shouldRedirect) {
            // ...wait for a moment so the user can read the error message...
            const timer = setTimeout(() => {
                navigate('/contact');
            }, 2500); // 2.5 second delay

            // ...and clean up the timer if the component unmounts
            return () => clearTimeout(timer);
        }
    }, [shouldRedirect, navigate]); // This effect runs only when `shouldRedirect` changes

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                if (onLoginSuccess) {
                    onLoginSuccess(data.user);
                }
                navigate('/');
            } else {
                // --- MODIFIED: Error handling logic ---
                if (data.errorCode === 'SUBSCRIPTION_EXPIRED') {
                    // Set the error message to display on the page
                    setError(data.error || 'Your subscription has expired. Please contact us to renew.');
                    // Set the flag to trigger the redirect effect
                    setShouldRedirect(true);
                } else {
                    setError(data.error || `Login failed. Server responded with status ${response.status}.`);
                }
            }
        } catch (err) {
            console.error('Login request error:', err);
            setError('Failed to connect to the server. Please check your network or if the server is running.');
        } finally {
            // This will now correctly set loading to false. The redirect is handled separately.
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper">
                <h2>Login</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {error && <p className="error-message">{error}</p>}
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading || shouldRedirect} // <-- Disable fields during redirect
                            placeholder="Enter your username"
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading || shouldRedirect} // <-- Disable fields during redirect
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="login-button" disabled={loading || shouldRedirect}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="extra-links">
                    <p>
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
                <div className="public-footer">
                <Link to="/privacy-policy">Privacy Policy</Link> | <Link to="/terms-and-conditions">Terms & Conditions</Link>
            </div>
            </div>
        </div>
    );
};

export default LoginPage;