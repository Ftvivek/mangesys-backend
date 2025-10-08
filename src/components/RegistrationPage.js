// src/components/RegistrationPage.js
// --- REFINED AND FINAL VERSION ---

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postWithAuth } from '../utils/api'; 
import './RegistrationPage.css';

const RegistrationPage = () => {
    // --- 1. Update component state for the new form fields ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState(''); // <-- NEW STATE
    const [mobileNo, setMobileNo] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        // --- 2. Update client-side validation ---
        if (!username || !password || !confirmPassword || !businessName || !mobileNo || !businessType) { // <-- ADDED VALIDATION
            setError('All fields are required.');
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            // --- 3. Create the new data payload to send to the server ---
            const registrationData = {
                username: username.trim(),
                password: password,
                businessName: businessName.trim(),
                businessType: businessType.trim(), // <-- SEND NEW DATA
                mobileNo: mobileNo.trim()
            };

            const response = await postWithAuth('/api/auth/register', registrationData);

            if (response.ok) {
                const data = await response.json();
                setSuccessMessage(data.message || 'Registration successful! Redirecting to login...');
                
                // Clear the form on success
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setBusinessName('');
                setBusinessType(''); // <-- CLEAR NEW STATE
                setMobileNo('');
                
                setTimeout(() => {
                    navigate('/login');
                }, 2500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || `Registration failed. Server responded with status ${response.status}.`);
            }
        } catch (err) {
            console.error('Registration request error:', err);
            setError('Failed to connect to the server. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-page-container">
            <div className="registration-form-wrapper">
                <h2>Create Account</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    
                    {/* --- 4. Update the form's JSX to include the new fields --- */}
                    <div className="form-group">
                        <label htmlFor="businessName">Name of Business / Center</label>
                        <input type="text" id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required disabled={loading} placeholder="e.g., Elite Fitness" />
                    </div>
                    {/* --- NEW FIELD --- */}
                    <div className="form-group">
                        <label htmlFor="businessType">Type of Business</label>
                        <input type="text" id="businessType" value={businessType} onChange={(e) => setBusinessType(e.target.value)} required disabled={loading} placeholder="e.g., Gym, Tuition Center, Library" />
                    </div>
                    {/* --- END NEW FIELD --- */}
                    <div className="form-group">
                        <label htmlFor="mobileNo">Mobile Number</label>
                        <input type="tel" id="mobileNo" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required disabled={loading} placeholder="e.g., 9876543210" maxLength="15" />
                    </div>
                    <hr className="form-divider" />
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} placeholder="Choose a username for login" autoComplete="username" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} placeholder="Create a password (min. 6 characters)" autoComplete="new-password" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} placeholder="Re-enter your password" autoComplete="new-password" />
                    </div>
                    
                    <button type="submit" className="register-button" disabled={loading}>
                        {loading ? 'Registering...' : 'Create My Account'}
                    </button>
                </form>
                <div className="extra-links">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
                <div className="public-footer">
                <Link to="/privacy-policy">Privacy Policy</Link> | <Link to="/terms-and-conditions">Terms & Conditions</Link>
            </div>
            </div>
        </div>
    );
};

export default RegistrationPage;