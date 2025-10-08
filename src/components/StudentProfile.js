// src/components/StudentProfile.js --- ENHANCED WITH EDIT MODE ---

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentProfile.css';
import { FaArrowLeft, FaUserCircle, FaSpinner, FaEdit, FaSave } from 'react-icons/fa';
import { getWithAuth, putWithAuth } from '../utils/api';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- NEW: State for editing ---
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState({});
    const [newPhoto, setNewPhoto] = useState(null);
    const [newIdProof, setNewIdProof] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchStudentProfile = async () => {
            setLoading(true);
            try {
                const response = await getWithAuth(`/api/students/${id}`);
                if (!response.ok) throw new Error('Failed to load student profile.');
                const data = await response.json();
                setStudent(data);
                setEditableData(data); // Initialize editable data
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStudentProfile();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, fileSetter) => {
        fileSetter(e.target.files[0]);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        const formData = new FormData();
        // Append only changed fields to avoid sending unnecessary data
        if (editableData.name !== student.name) formData.append('name', editableData.name);
        if (editableData.grade !== student.grade) formData.append('grade', editableData.grade);
        if (editableData.mobile_no !== student.mobile_no) formData.append('mobile_no', editableData.mobile_no);
        if (editableData.address !== student.address) formData.append('address', editableData.address);
        if (newPhoto) formData.append('student_photo', newPhoto);
        if (newIdProof) formData.append('id_proof', newIdProof);

        // Check if there's anything to update
        if ([...formData.entries()].length === 0) {
            setIsEditing(false);
            setSaving(false);
            return;
        }
        
        try {
            const response = await putWithAuth(`/api/students/${id}`, formData);
            if (!response.ok) throw new Error('Failed to save changes.');
            // Refresh data by re-fetching to get the new S3 URLs
            const fetchResponse = await getWithAuth(`/api/students/${id}`);
            const updatedData = await fetchResponse.json();
            setStudent(updatedData);
            setEditableData(updatedData); // Reset editable data to the new saved state
            setNewPhoto(null); // Clear file inputs
            setNewIdProof(null);
            setIsEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditableData(student); // Revert changes
        setNewPhoto(null);
        setNewIdProof(null);
        setError(null);
    };
    
    if (loading) return <div className="student-profile-container loading-state"><FaSpinner className="spinner-icon" /></div>;
    if (error && !isEditing) return <div className="student-profile-container error-state"><p>{error}</p></div>; // Don't show old errors if user starts editing
    if (!student) return <div className="student-profile-container not-found-state"><p>Student not found.</p></div>;

    return (
        <div className="student-profile-container">
            <button onClick={() => navigate(-1)} className="back-link"><FaArrowLeft /> Go Back</button>

            {/* --- EDIT / SAVE / CANCEL BUTTONS --- */}
            <div className="profile-actions">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="action-btn save-btn" disabled={saving}>
                            <FaSave /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={handleCancel} className="action-btn cancel-btn" disabled={saving}>
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
                {student.student_photo ? <img src={student.student_photo} alt={student.name} className="profile-photo" /> : <FaUserCircle className="user-icon-large default-profile-icon" />}
                {isEditing ? (
                    <input type="text" name="name" value={editableData.name || ''} onChange={handleInputChange} className="name-input"/>
                ) : (
                    <h2>{student.name}</h2>
                )}
            </div>
            
            <div className="profile-details">
                {/* Each item is now conditional */}
                <div className="detail-item"><strong>Grade:</strong> {isEditing ? <input type="text" name="grade" value={editableData.grade || ''} onChange={handleInputChange}/> : <span>{student.grade || 'N/A'}</span>}</div>
                <div className="detail-item"><strong>Mobile No:</strong> {isEditing ? <input type="tel" name="mobile_no" value={editableData.mobile_no || ''} onChange={handleInputChange}/> : <span>{student.mobile_no || 'N/A'}</span>}</div>
                <div className="detail-item"><strong>Address:</strong> {isEditing ? <textarea name="address" value={editableData.address || ''} onChange={handleInputChange}/> : <span>{student.address || 'N/A'}</span>}</div>
                <div className="detail-item"><strong>Admission Date:</strong> <span>{new Date(student.admission_date).toLocaleDateString() || 'N/A'}</span></div>
                
                {isEditing && (
                    <>
                        <div className="detail-item">
                            <label>Update Photo:</label>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setNewPhoto)} />
                            {newPhoto && <span className="file-name">{newPhoto.name}</span>}
                        </div>
                        <div className="detail-item">
                            <label>Update ID Proof:</label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, setNewIdProof)} />
                            {newIdProof && <span className="file-name">{newIdProof.name}</span>}
                        </div>
                    </>
                )}
                
                {student.id_proof && !isEditing && (
                    <div className="detail-item"><strong>ID Proof:</strong><span><a href={student.id_proof} target="_blank" rel="noopener noreferrer" className="document-link">View Document</a></span></div>
                )}
            </div>
            {error && <p className="error-message" style={{textAlign: 'center', marginTop: '20px'}}>{error}</p>}
        </div>
    );
};

export default StudentProfile;