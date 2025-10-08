// src/components/SettingsPage.js --- FINAL RESTRUCTURED VERSION ---
import { Link } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { postWithAuth, getWithAuth, putWithAuth } from '../utils/api';
import './SettingsPage.css';

// --- Sub-component for Password Form ---
const ChangePasswordForm = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.'); return;
        }
        setLoading(true);
        try {
            const response = await postWithAuth('/api/user/change-password', { oldPassword, newPassword, confirmPassword });
            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message || 'Password changed successfully!');
                setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            } else { setError(data.error || 'Failed to change password.'); }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <form className="change-password-form" onSubmit={handleSubmit}>
            <h3>Change Password</h3>
            <div className="form-group">
                <label htmlFor="oldPassword">Old Password</label>
                <input type="password" id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <p className="message error-message">{error}</p>}
            {success && <p className="message success-message">{success}</p>}
            <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    );
};

// --- Sub-component for Reminder Settings ---
const ReminderSettingsSection = () => {
    const [isRemindersActive, setIsRemindersActive] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        setLoadingSettings(true);
        getWithAuth('/api/reminders/settings')
            .then(res => res.json())
            .then(data => setIsRemindersActive(data.isRemindersActive))
            .catch(err => console.error("Failed to fetch reminder settings:", err))
            .finally(() => setLoadingSettings(false));
    }, []); // Empty array ensures this runs only ONCE.

    const handleToggleReminders = async () => {
        const newStatus = !isRemindersActive;
        setIsRemindersActive(newStatus);
        try {
            const response = await putWithAuth('/api/reminders/settings', { isRemindersActive: newStatus });
            if (!response.ok) {
                setIsRemindersActive(!newStatus);
                throw new Error("Server rejected the update.");
            }
        } catch (error) {
            console.error("Failed to update reminder settings:", error);
            alert('Failed to update settings. Please try again.');
        }
    };

    return (
        <div className="reminders-section">
            <h3>Reminder Settings</h3>
            <div className="toggle-container">
                <label>Automated 7 AM Reminders</label> {/* Simpler label */}

                {/* --- THIS IS THE FIX --- */}
                <label className="toggle-switch"> {/* It is now a <label> */}
                    <input
                        type="checkbox"
                        id="automation-toggle"
                        checked={isRemindersActive}
                        onChange={handleToggleReminders}
                        disabled={loadingSettings}
                    />
                    <span className="slider round"></span>
                </label>
                {/* --- END OF FIX --- */}

                <span className={isRemindersActive ? 'status-active' : 'status-inactive'}>
                    {loadingSettings ? 'LOADING...' : (isRemindersActive ? 'ACTIVE' : 'INACTIVE')}
                </span>
            </div>
        </div>
    );
};


// --- Main SettingsPage Component ---
const SettingsPage = () => {
    return (
        <div className="settings-container">
            <h2>Account Settings</h2>
            <ChangePasswordForm />
            <hr className="settings-divider" />
            <ReminderSettingsSection />
            <hr className="settings-divider" />
            <div className="legal-section">
                <h3>Legal Information</h3>
                <Link to="/privacy-policy" className="legal-link" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                </Link>
                <Link to="/terms-and-conditions" className="legal-link" target="_blank" rel="noopener noreferrer">
                    Terms & Conditions
                </Link>
            </div>
        </div>
    );
};

export default SettingsPage;