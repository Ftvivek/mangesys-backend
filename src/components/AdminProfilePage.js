// src/components/AdminProfilePage.js --- NEW FILE ---

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentProfile.css'; // We can reuse the same CSS!
import { FaArrowLeft, FaEdit, FaSave, FaSpinner } from 'react-icons/fa';
import { getWithAuth, putWithAuth } from '../utils/api';
import { saveAuthData } from '../utils/auth'; // Import function to update localStorage

const AdminProfilePage = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState({});
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await getWithAuth('/api/user/profile');
            if (!response.ok) throw new Error('Failed to load your profile.');
            const data = await response.json();
            setProfile(data);
            setEditableData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        setEditableData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const response = await putWithAuth('/api/user/profile', editableData);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save changes.');

            // IMPORTANT: Update localStorage with the new token and user data
            saveAuthData(data.token, data.user);

            // Refresh the page to reflect new data and exit edit mode
            await fetchProfile();
            setIsEditing(false);
            
            // Optional: Reload the whole app to update header, etc.
            window.location.reload();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="student-profile-container loading-state"><FaSpinner className="spinner-icon" /></div>;
    if (error) return <div className="student-profile-container error-state"><p>{error}</p></div>;
    if (!profile) return <div className="student-profile-container not-found-state"><p>Profile not found.</p></div>;

    return (
        <div className="student-profile-container">
            <button onClick={() => navigate(-1)} className="back-link"><FaArrowLeft /> Go Back</button>

            <div className="profile-actions">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="action-btn save-btn" disabled={saving}>
                            <FaSave /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setIsEditing(false)} className="action-btn cancel-btn" disabled={saving}>
                            Cancel
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="action-btn edit-btn">
                        <FaEdit /> Edit Profile
                    </button>
                )}
            </div>

            <div className="profile-header">
                {isEditing ? (
                    <input type="text" name="username" value={editableData.username} onChange={handleInputChange} className="name-input"/>
                ) : (
                    <h2>{profile.username}</h2>
                )}
            </div>
            
            <div className="profile-details">
                <div className="detail-item"><strong>Business Name:</strong> {isEditing ? <input type="text" name="business_name" value={editableData.business_name || ''} onChange={handleInputChange}/> : <span>{profile.business_name || 'N/A'}</span>}</div>
                <div className="detail-item"><strong>Business Type:</strong> {isEditing ? <input type="text" name="business_type" value={editableData.business_type || ''} onChange={handleInputChange}/> : <span>{profile.business_type || 'N/A'}</span>}</div>
                <div className="detail-item"><strong>Mobile No:</strong> {isEditing ? <input type="tel" name="mobile_no" value={editableData.mobile_no || ''} onChange={handleInputChange}/> : <span>{profile.mobile_no || 'N/A'}</span>}</div>
            </div>
            {error && <p className="error-message" style={{textAlign: 'center', marginTop: '20px'}}>{error}</p>}
        </div>
    );
};

export default AdminProfilePage;