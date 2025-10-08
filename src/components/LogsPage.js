// src/components/LogsPage.js --- MODIFIED VERSION ---

import React, { useState, useEffect, useCallback } from 'react';
import { getWithAuth } from '../utils/api';
import './LogsPage.css';

// Helper to get dates in YYYY-MM-DD format
const getISODate = (date) => date.toISOString().split('T')[0];

const LogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for date filters
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState(getISODate(firstDayOfMonth));
    const [endDate, setEndDate] = useState(getISODate(today));

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        setLogs([]); // Clear previous logs
        try {
            const response = await getWithAuth(`/api/logs?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch logs.');
            }
            const data = await response.json();
            setLogs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, []); // Fetch logs on initial component mount with default dates

    const handleFetchClick = (e) => {
        e.preventDefault();
        fetchLogs();
    };

    return (
        <div className="logs-container">
            <h1>WhatsApp Message Logs</h1>
            
            <form className="log-filters" onSubmit={handleFetchClick}>
                <div className="filter-group">
                    <label htmlFor="start-date">Start Date</label>
                    <input 
                        type="date" 
                        id="start-date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label htmlFor="end-date">End Date</label>
                    <input 
                        type="date" 
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <button type="submit" className="fetch-btn" disabled={loading}>
                    {loading ? 'Fetching...' : 'Fetch Logs'}
                </button>
            </form>

            <div className="logs-results">
                {/* --- ADDED THIS NEW BLOCK --- */}
                {!loading && (
                    <div className="logs-summary">
                        <p>Found <strong>{logs.length}</strong> log(s) for the selected period.</p>
                    </div>
                )}
                {/* --- END OF NEW BLOCK --- */}

                {error && <p className="error-message">{error}</p>}
                {!loading && !error && logs.length === 0 && <p className="no-logs-message">No logs found for the selected date range.</p>}
                
                {logs.length > 0 && (
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Member Name</th>
                                <th>Mobile Number</th>
                                <th>Status</th>
                                <th>Details / Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={index}>
                                    <td>{new Date(log.sent_on).toLocaleString()}</td>
                                    <td>{log.student_name}</td>
                                    <td>{log.student_mobile}</td>
                                    <td>
                                        <span className={`log-status ${log.status}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td>{log.status === 'failed' ? log.error_message : log.message_sid}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default LogsPage;