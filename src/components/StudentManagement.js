// src/components/StudentManagement.js
// --- COMPLETE MODIFIED VERSION (with Send Reminder button) ---

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './StudentManagement.css';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaCog, FaPaperPlane } from 'react-icons/fa'; // Added FaPaperPlane
import { getWithAuth, putWithAuth, postWithAuth } from '../utils/api'; // Added postWithAuth

const StudentManagement = ({ onPaymentSuccess }) => {
    // --- Hooks (No change) ---
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedDate = searchParams.get('date');

    // --- State (No change) ---
    const [pendingStudents, setPendingStudents] = useState([]);
    const [paidStudents, setPaidStudents] = useState([]);
    const [suspendedStudents, setSuspendedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- State for the UI features (No change) ---
    const [configuringStudentId, setConfiguringStudentId] = useState(null);
    const [planChoice, setPlanChoice] = useState('existing');
    const [customFee, setCustomFee] = useState('');
    const [customDuration, setCustomDuration] = useState('1');
    const [actionError, setActionError] = useState(null);

    // --- NEW: State to track reminder sending status ---
    const [reminderStatus, setReminderStatus] = useState({});

    // --- Data Fetching (No change) ---
    const fetchStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getWithAuth(`/api/students/manageable-on-date/${selectedDate}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setPendingStudents(data.pending || []);
            setPaidStudents(data.paid || []);
            setSuspendedStudents(data.suspended || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate) {
            fetchStudents();
        } else {
            setError("No date selected.");
            setLoading(false);
        }
    }, [selectedDate]);

    // --- Action Handlers (No change) ---
    const handleToggleConfigure = (student) => {
        if (configuringStudentId === student.id) {
            setConfiguringStudentId(null);
        } else {
            setConfiguringStudentId(student.id);
            setPlanChoice('existing');
            setCustomFee('');
            setCustomDuration('1');
            setActionError(null);
        }
    };

    const handlePaymentAction = async (student, paymentType) => {
        // ... (This entire function remains unchanged) ...
        setActionError(null);
        let payload = {
            paymentType,
            updatePlan: false,
        };

        if (planChoice === 'custom') {
            if (!customFee || !customDuration || parseFloat(customFee) < 0) {
                setActionError('Please enter a valid custom fee and duration.');
                return;
            }
            payload.updatePlan = true;
            payload.feeAmount = customFee;
            payload.planDuration = customDuration;
        }

        try {
            const response = await putWithAuth(`/api/student-payment/${student.id}/${selectedDate}`, payload);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Payment processing failed.');
            }
            
            if (onPaymentSuccess) {
                onPaymentSuccess();
            }
            navigate('/');

        } catch (err) {
            setActionError(err.message);
        }
    };

    // --- NEW: Function to handle sending a reminder ---
    const handleSendReminder = async (studentId) => {
        setReminderStatus(prev => ({ ...prev, [studentId]: 'sending' }));
        try {
            const response = await postWithAuth(`/api/reminders/send-manual/${studentId}`, {});
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || 'Failed to send reminder.');
            }
            setReminderStatus(prev => ({ ...prev, [studentId]: 'sent' }));
            // Set a timeout to reset the button state after a few seconds
            setTimeout(() => {
                setReminderStatus(prev => ({...prev, [studentId]: null }));
            }, 3000);
        } catch (error) {
            setReminderStatus(prev => ({ ...prev, [studentId]: 'error' }));
            alert(`Error sending reminder: ${error.message}`);
        }
    };
    
    if (loading) return <div className="student-management-container loading-state"><FaSpinner className="icon-spinner" /> Loading...</div>;
    if (error) return <div className="student-management-container error-state">Error: {error}</div>;

    return (
        <div className="student-management-container">
            <button onClick={() => navigate(-1)} className="back-link">
                <FaArrowLeft /> Back to Home
            </button>
            <h2>Actions for Day: {selectedDate}</h2>
            
            <section className="status-section">
                <h3>Pending Action</h3>
                {pendingStudents.length > 0 ? (
                    <table className="student-table">
                        {/* --- MODIFIED: Added an extra column for Actions --- */}
                        <thead><tr><th>Name</th><th>Actions</th></tr></thead>
                        <tbody>
                            {pendingStudents.map(student => (
                                <React.Fragment key={student.id}>
                                    <tr>
                                        <td data-label="Name">
                                            <Link to={`/student-profile/${student.id}`} className="student-name-link">
                                                {student.name}
                                                {student.is_special && <span className="special-marker"> *</span>}
                                            </Link>
                                        </td>
                                        {/* --- MODIFIED: This cell now contains both buttons --- */}
                                        <td data-label="Actions" className="actions-cell">
                                            <button
                                                onClick={() => handleSendReminder(student.id)}
                                                className={`action-btn reminder-btn ${reminderStatus[student.id] || ''}`}
                                                disabled={reminderStatus[student.id] === 'sending' || reminderStatus[student.id] === 'sent'}
                                                title="Send WhatsApp Reminder"
                                            >
                                                <FaPaperPlane />
                                                {reminderStatus[student.id] === 'sending' ? 'Sending...' : reminderStatus[student.id] === 'sent' ? 'Sent' : 'Remind'}
                                            </button>
                                            <button onClick={() => handleToggleConfigure(student)} className="action-btn configure-btn" title="Configure & Pay">
                                                <FaCog /> Pay
                                            </button>
                                        </td>
                                    </tr>
                                    {configuringStudentId === student.id && (
                                        <tr className="configure-plan-row">
                                            {/* --- MODIFIED: colSpan is now 2 --- */}
                                            <td colSpan="2">
                                                <div className="configure-plan-form">
                                                    {/* ... (This inner form part remains unchanged) ... */}
                                                    <div className="plan-choices">
                                                        <label>
                                                            <input type="radio" value="existing" checked={planChoice === 'existing'} onChange={() => setPlanChoice('existing')} />
                                                            Use Existing Plan
                                                        </label>
                                                        <label>
                                                            <input type="radio" value="custom" checked={planChoice === 'custom'} onChange={() => setPlanChoice('custom')} />
                                                            Set Custom Plan for this Payment
                                                        </label>
                                                    </div>

                                                    {planChoice === 'custom' && (
                                                        <div className="custom-plan-inputs">
                                                            <div className="form-group">
                                                                <label>New Fee Amount</label>
                                                                <input type="number" value={customFee} onChange={(e) => setCustomFee(e.target.value)} placeholder="e.g., 1500" />
                                                            </div>
                                                            <div className="form-group">
                                                                <label>New Duration</label>
                                                                <select value={customDuration} onChange={(e) => setCustomDuration(e.target.value)}>
                                                                    <option value="1">1 Month</option>
                                                                    <option value="3">3 Months</option>
                                                                    <option value="6">6 Months</option>
                                                                    <option value="12">1 Year</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {actionError && <p className="error-message">{actionError}</p>}
                                                    
                                                    <div className="final-action-buttons">
                                                        <span>Final Action:</span>
                                                        <button onClick={() => handlePaymentAction(student, 'cash')} className="button-cash">Mark as Cash</button>
                                                        <button onClick={() => handlePaymentAction(student, 'online')} className="button-online">Mark as Online</button>
                                                        <button onClick={() => handlePaymentAction(student, 'suspend')} className="button-suspend">Suspend</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                ) : <p>All members have been attended to for this day.</p>}
            </section>
            
            <section className="status-section">
                <h3><FaCheckCircle className="icon-success" /> Paid</h3>
                 {/* ... (This section is unchanged) ... */}
                {paidStudents.length > 0 ? (
                    <ul>
                        {paidStudents.map(s => 
                            <li key={s.id}>
                                <Link to={`/student-profile/${s.id}`}>{s.name}</Link> ({s.payment_type})
                            </li>
                        )}
                    </ul>
                ) : <p>None for this day.</p>}
            </section>
            
            <section className="status-section">
                <h3><FaTimesCircle className="icon-danger" /> Suspended</h3>
                {/* ... (This section is unchanged) ... */}
                {suspendedStudents.length > 0 ? (
                     <ul>
                        {suspendedStudents.map(s => 
                            <li key={s.id}>
                                <Link to={`/student-profile/${s.id}`}>{s.name}</Link>
                            </li>
                        )}
                    </ul>
                ) : <p>None for this day.</p>}
            </section>
        </div>
    );
};

export default StudentManagement;