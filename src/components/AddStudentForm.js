// src/components/AddStudentForm.js
// --- REVISED AS A PAGE COMPONENT ---

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './AddStudentForm.css';
import { postWithAuth } from '../utils/api';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.095 0 5.555 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11h4.188C14.502 11 16 9.57 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 1.999 10.69 0 8 0zm-.5 14.5V11h1v3.5a.5.5 0 0 1-1 0z"/>
    </svg>
);

// The component no longer needs `onClose`
const AddStudentForm = ({ onStudentAdded }) => {
    const navigate = useNavigate(); // Hook for navigation

    const [name, setName] = useState('');
    const [admissionDate, setAdmissionDate] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [admissionFee, setAdmissionFee] = useState('');
    const [address, setAddress] = useState('');
    const [grade, setGrade] = useState('');
    const [customMonthlyFee, setCustomMonthlyFee] = useState('');
    const [planDuration, setPlanDuration] = useState('1');
    const [memberPhoto, setMemberPhoto] = useState(null);
    const [idProof, setIdProof] = useState(null);
    const [photoName, setPhotoName] = useState('');
    const [idProofName, setIdProofName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

    const handleMobileChange = (event) => {
        const value = event.target.value;
        if (/^\d*$/.test(value) && value.length <= 10) { setMobileNo(value); }
    };
    const handleFileChange = (event, setFile, setNameDisplay) => {
        const file = event.target.files[0];
        if (file) { setFile(file); setNameDisplay(file.name); } 
        else { setFile(null); setNameDisplay(''); }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmissionError('');
        const trimmedName = name.trim();
        if (!trimmedName || !mobileNo || !admissionDate) {
            setSubmissionError('Please fill in all required fields (*).');
            return;
        }
        if (mobileNo.length !== 10 || !/^\d*$/.test(mobileNo)) {
            setSubmissionError('Mobile number must be a 10-digit number.');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('name', trimmedName);
        formData.append('admissionDate', admissionDate);
        formData.append('mobile_no', mobileNo);
        if (admissionFee) formData.append('admissionFee', admissionFee);
        if (address.trim()) formData.append('address', address.trim());
        if (grade.trim()) formData.append('grade', grade.trim());
        if (showAdditionalInfo) {
            if (customMonthlyFee) formData.append('feeAmount', customMonthlyFee);
            if (planDuration) formData.append('planDuration', planDuration);
            if (memberPhoto) formData.append('student_photo', memberPhoto);
            if (idProof) formData.append('id_proof', idProof);
        }
        try {
            const response = await postWithAuth('/api/students', formData);
            if (response.ok) {
                if(onStudentAdded) onStudentAdded(); // Trigger calendar refresh
                navigate('/'); // Navigate to dashboard on success
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Server error.' }));
                setSubmissionError(errorData.error || `Failed to add member. Status: ${response.status}.`);
            }
        } catch (error) {
            if (error.message && !error.message.includes('Authentication failed')) {
                setSubmissionError('Failed to connect to the server.');
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        // The overlay div is removed. We only need the container.
        <div className="add-student-form-container">
            <h2>Add New Member</h2>
            {/* The close button is removed. */}
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group"><label>Full Name <span className="required">*</span></label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="form-group"><label>Mobile No. <span className="required">*</span></label><input type="tel" value={mobileNo} onChange={handleMobileChange} required maxLength="10" /></div>
                <div className="form-group"><label>Admission Date <span className="required">*</span></label><input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} required /></div>
                <hr className="form-divider" />
                <div className="form-group"><label>Admission Fee Amount</label><input type="number" value={admissionFee} onChange={(e) => setAdmissionFee(e.target.value)} min="0" placeholder="e.g., 1500" /></div>
                <div className="form-group"><label>Address</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="3"></textarea></div>
                <div className="form-group"><label>Description </label><input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} /></div>
                <div className="additional-info-toggle" onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}>
                    {showAdditionalInfo ? '▼ Hide' : '► Show'} Additional Information (for Custom Recurring Plans)
                </div>
                {showAdditionalInfo && (
                    <div className="additional-info-section">
                        <div className="form-group">
                            <label>Custom Monthly Fee (Optional)</label> 
                            <input type="number" value={customMonthlyFee} onChange={(e) => setCustomMonthlyFee(e.target.value)} min="0" placeholder="e.g., 1200" />
                        </div>
                        <div className="form-group">
                            <label>Plan Duration (Optional)</label>
                            <select value={planDuration} onChange={(e) => setPlanDuration(e.target.value)}>
                                <option value="1">1 Month</option><option value="3">3 Months</option><option value="6">6 Months</option><option value="12">1 Year</option>
                            </select>
                        </div>
                        <div className="form-group file-group"><label>Member Photo (Optional)</label><label htmlFor="member_photo" className="file-label"><UploadIcon /><span>{photoName || 'Choose Photo...'}</span></label><input type="file" id="member_photo" onChange={(e) => handleFileChange(e, setMemberPhoto, setPhotoName)} className="file-input-hidden" /></div>
                        <div className="form-group file-group"><label>ID Proof (Optional)</label><label htmlFor="id_proof" className="file-label"><UploadIcon /><span>{idProofName || 'Choose ID Proof...'}</span></label><input type="file" id="id_proof" onChange={(e) => handleFileChange(e, setIdProof, setIdProofName)} className="file-input-hidden" /></div>
                    </div>
                )}
                {submissionError && <p className="error-message">{submissionError}</p>}
                <div className="form-actions">
                    {/* The cancel button now navigates back to the homepage */}
                    <button type="button" className="button-cancel" onClick={() => navigate('/')} disabled={uploading}>Cancel</button>
                    <button type="submit" className="button-submit" disabled={uploading}>{uploading ? 'Adding...' : 'Add Member'}</button>
                </div>
            </form>
        </div>
    );
};

export default AddStudentForm;