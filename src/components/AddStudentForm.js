// src/components/AddStudentForm.js --- UPDATED WITH ADMISSION FEE IN ADVANCED MODE ---

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddStudentForm.css';
import { postWithAuth } from '../utils/api';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.095 0 5.555 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11h4.188C14.502 11 16 9.57 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 1.999 10.69 0 8 0zm-.5 14.5V11h1v3.5a.5.5 0 0 1-1 0z"/>
    </svg>
);

const AddStudentForm = ({ onStudentAdded }) => {
    const navigate = useNavigate();

    const [formType, setFormType] = useState('simple');
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
        setUploading(true);
        const formData = new FormData();
        
        // Append common fields
        formData.append('name', trimmedName);
        formData.append('admissionDate', admissionDate);
        formData.append('mobile_no', mobileNo);
        if (address.trim()) formData.append('address', address.trim());
        if (grade.trim()) formData.append('grade', grade.trim());
        if (memberPhoto) formData.append('student_photo', memberPhoto);
        if (idProof) formData.append('id_proof', idProof);

        // --- CHANGE 1: Fee handling logic updated ---
        // Always check for and append the one-time admission fee, regardless of form type.
        if (admissionFee) formData.append('admissionFee', admissionFee);

        // Append recurring plan fields ONLY if the advanced form is selected.
        if (formType === 'advanced') {
            if (customMonthlyFee) formData.append('feeAmount', customMonthlyFee);
            if (planDuration) formData.append('planDuration', planDuration);
        }

        try {
            const response = await postWithAuth('/api/students', formData);
            if (response.ok) {
                if(onStudentAdded) onStudentAdded();
                navigate('/');
            } else {
                const errorData = await response.json();
                setSubmissionError(errorData.error || 'Failed to add member.');
            }
        } catch (error) {
            setSubmissionError('Failed to connect to the server.');
        } finally {
            setUploading(false);
        }
    };

    // --- CHANGE 2: To avoid duplicating code, create a reusable JSX element for the Admission Fee input ---
    const admissionFeeInput = (
        <div className="form-group">
            <label>Admission Fee</label>
            <input type="number" value={admissionFee} onChange={(e) => setAdmissionFee(e.target.value)} min="0" placeholder="One-time fee" />
        </div>
    );

    return (
        <div className="add-student-form-container">
            <h2>Add New Member</h2>

            <div className="form-toggle-tabs">
                <button type="button" className={`tab-button ${formType === 'simple' ? 'active' : ''}`} onClick={() => setFormType('simple')}>
                    Simple Registration
                </button>
                <button type="button" className={`tab-button ${formType === 'advanced' ? 'active' : ''}`} onClick={() => setFormType('advanced')}>
                    Advanced (Custom Plan)
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                {/* Section for common fields that appear in both modes */}
                <div className="form-section">
                    <div className="form-group"><label>Full Name <span className="required">*</span></label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                    <div className="form-group"><label>Mobile No. <span className="required">*</span></label><input type="tel" value={mobileNo} onChange={handleMobileChange} required maxLength="10" /></div>
                    <div className="form-group"><label>Admission Date <span className="required">*</span></label><input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} required /></div>
                </div>

                <div className="form-divider"></div>

                {/* Conditional fields based on formType */}
                {formType === 'simple' && (
                    <div className="form-section">
                        {/* Render the admission fee input for simple mode */}
                        {admissionFeeInput}
                    </div>
                )}
                {formType === 'advanced' && (
                    <div className="form-section">
                        {/* Render the admission fee input for advanced mode */}
                        {admissionFeeInput}
                        <div className="form-group"><label>Custom Monthly Fee</label><input type="number" value={customMonthlyFee} onChange={(e) => setCustomMonthlyFee(e.target.value)} min="0" placeholder="Recurring fee amount" /></div>
                        <div className="form-group"><label>Plan Duration</label><select value={planDuration} onChange={(e) => setPlanDuration(e.target.value)}><option value="1">1 Month</option><option value="3">3 Months</option><option value="6">6 Months</option><option value="12">1 Year</option></select></div>
                    </div>
                )}

                {/* More common fields */}
                <div className="form-section">
                     <div className="form-group"><label>Address</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="3"></textarea></div>
                    <div className="form-group"><label>Description / Notes</label><input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} /></div>
                    <div className="form-group"><label>Member Photo</label><label htmlFor="member_photo" className="file-label"><UploadIcon /><span>{photoName || 'Click to upload photo'}</span></label><input type="file" id="member_photo" onChange={(e) => handleFileChange(e, setMemberPhoto, setPhotoName)} className="file-input-hidden" accept="image/*" /></div>
                    <div className="form-group"><label>ID Proof</label><label htmlFor="id_proof" className="file-label"><UploadIcon /><span>{idProofName || 'Click to upload ID'}</span></label><input type="file" id="id_proof" onChange={(e) => handleFileChange(e, setIdProof, setIdProofName)} className="file-input-hidden" /></div>
                </div>
                
                {submissionError && <p className="error-message">{submissionError}</p>}

                <div className="form-actions">
                    <button type="button" className="button-cancel" onClick={() => navigate('/')} disabled={uploading}>Cancel</button>
                    <button type="submit" className="button-submit" disabled={uploading}>{uploading ? 'Adding...' : 'Add Member'}</button>
                </div>
            </form>
        </div>
    );
};

export default AddStudentForm;