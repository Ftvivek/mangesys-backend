// src/components/RemindersPage.js --- MODIFIED VERSION ---
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { getWithAuth, postWithAuth } from '../utils/api';
import './RemindersPage.css';

const RemindersPage = () => {
    // Initialize useNavigate
    const navigate = useNavigate();

    // State is now ONLY for the status and manual list
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState(null);
    
    const [dueStudents, setDueStudents] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState(null);
    const [sendingStatus, setSendingStatus] = useState({});

    const fetchAllData = useCallback(() => {
        setLoadingStats(true);
        getWithAuth('/api/reminders/daily-status')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => setStatsError(err.message))
            .finally(() => setLoadingStats(false));

        setLoadingList(true);
        getWithAuth('/api/reminders/due-today')
            .then(res => res.json())
            .then(data => setDueStudents(data))
            .catch(err => setListError(err.message))
            .finally(() => setLoadingList(false));
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSendReminder = async (studentId) => {
        setSendingStatus(prev => ({ ...prev, [studentId]: 'sending' }));
        try {
            const response = await postWithAuth(`/api/reminders/send-manual/${studentId}`, {});
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || 'Failed to send.');
            }
            setSendingStatus(prev => ({ ...prev, [studentId]: 'sent' }));
            setTimeout(fetchAllData, 1000); // Refresh stats after sending
        } catch (error) {
            setSendingStatus(prev => ({ ...prev, [studentId]: 'error' }));
            alert(`Error: ${error.message}`);
        }
    };

    const getFormattedDate = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="reminders-container">
            {/* --- MODIFIED HEADER SECTION --- */}
            <div className="reminders-header">
                <div className="header-title">
                    <h1>Today's Reminder Status</h1>
                    <p className="description">Dashboard for <strong>{getFormattedDate()}</strong></p>
                </div>
                <button className="view-logs-btn" onClick={() => navigate('/logs')}>
                    View Full Logs
                </button>
            </div>

            {/* Status Summary Section (Unchanged) */}
            <div className="status-summary-container">
                <h3>Status Summary</h3>
                {loadingStats && <p>Loading latest status...</p>}
                {statsError && <p className="error-message">Error: {statsError}</p>}
                {stats && !loadingStats && (
                    <div className="status-grid">
                        <div className="stat-box"><h2>{stats.totalDueToday}</h2><p>Members Due Today</p></div>
                        <div className="stat-box success"><h2>{stats.totalSentToday}</h2><p>Sent Successfully</p></div>
                        <div className="stat-box error"><h2>{stats.failedMessages?.length || 0}</h2><p>Failed to Send</p></div>
                    </div>
                )}
            </div>
            
            {/* Manual Sending Section (Unchanged) */}
            <div className="due-list-container">
                <h3>Manual Reminder Actions</h3>
                {loadingList && <p>Loading members due today...</p>}
                {listError && <p className="error-message">Error fetching list: {listError}</p>}
                {!loadingList && dueStudents.length === 0 && <p>No members are due for a reminder today.</p>}
                {!loadingList && dueStudents.length > 0 && (
                    <table>
                        <thead>
                            <tr><th>Member Name</th><th>Mobile Number</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {dueStudents.map((student) => {
                                const status = sendingStatus[student.id];
                                return (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.mobile_no}</td>
                                        <td>
                                            <button
                                                className={`send-reminder-btn ${status}`}
                                                onClick={() => handleSendReminder(student.id)}
                                                disabled={status === 'sending' || status === 'sent'}
                                            >
                                                {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Sent ✔' : status === 'error' ? 'Retry ✖' : 'Send Reminder'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            
            {/* Failed Messages List (Unchanged) */}
            {stats?.failedMessages?.length > 0 && (
                <div className="failed-list">
                    <h3>Failed Message Details</h3>
                    {/* ... table for failed messages ... */}
                </div>
            )}
        </div>
    );
};

export default RemindersPage;