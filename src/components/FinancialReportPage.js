import React, { useState, useEffect, useCallback } from 'react';
import { getWithAuth } from '../utils/api';
import './FinancialReportPage.css'; // We will create this next
import { FaDollarSign, FaCashRegister, FaCreditCard, FaReceipt } from 'react-icons/fa';

// Helper to get dates in YYYY-MM-DD format
const getISODate = (date) => date.toISOString().split('T')[0];

const FinancialReportPage = () => {
    const [summary, setSummary] = useState({ total: 0, cash: 0, online: 0, admissions: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Default the date range to the current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState(getISODate(firstDayOfMonth));
    const [endDate, setEndDate] = useState(getISODate(today));

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // NOTE: This assumes a new backend endpoint exists to handle this query
            const response = await getWithAuth(`/api/reports/financial-summary?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) {
                throw new Error('Failed to fetch financial report.');
            }
            const data = await response.json();
            setSummary(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const handleFetchClick = () => {
        fetchSummary();
    };

    return (
        <div className="financial-report-container">
            <h1>Financial Report</h1>

            <div className="filter-section">
                <div className="date-picker-group">
                    <label htmlFor="start-date">Start Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="date-picker-group">
                    <label htmlFor="end-date">End Date</label>
                    <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <button onClick={handleFetchClick} className="fetch-button" disabled={loading}>
                    {loading ? 'Loading...' : 'Generate Report'}
                </button>
            </div>

            <div className="summary-section">
                {loading && <p>Loading report...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && (
                    <div className="summary-cards">
                        <div className="stat-card total">
                            <div className="card-icon"><FaDollarSign /></div>
                            <div className="card-content">
                                <p>Total Collection</p>
                                <h2>₹{summary.total?.toLocaleString('en-IN') || 0}</h2>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="card-icon"><FaCashRegister /></div>
                            <div className="card-content">
                                <p>Collected in Cash</p>
                                <h2>₹{summary.cash?.toLocaleString('en-IN') || 0}</h2>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="card-icon"><FaCreditCard /></div>
                            <div className="card-content">
                                <p>Collected Online</p>
                                <h2>₹{summary.online?.toLocaleString('en-IN') || 0}</h2>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="card-icon"><FaReceipt /></div>
                            <div className="card-content">
                                <p>New Admission Fees</p>
                                <h2>₹{summary.admissions?.toLocaleString('en-IN') || 0}</h2>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialReportPage;