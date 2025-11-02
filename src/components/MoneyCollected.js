// src/components/MoneyCollected.js
// --- REWIRED TO USE total_money TABLE and new API endpoint ---

import React, { useState, useEffect } from 'react';
import './MoneyCollected.css';
import { getWithAuth } from '../utils/api'; 

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const MoneyCollected = ({ user, refreshSignal }) => {
    const [cashAmount, setCashAmount] = useState(0);
    const [upiAmount, setUpiAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    
    useEffect(() => {
        const fetchTransactionData = async () => {
            if (!selectedDate) {
                setError("Please select a valid date.");
                return;
            }
            setIsLoading(true);
            setError(null);
            
            setCashAmount(0);
            setUpiAmount(0);

            try {
                // Use the new API endpoint
                const response = await getWithAuth(`/api/transactions/summary/${selectedDate}`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();

                setCashAmount(data.totalCash);
                setUpiAmount(data.totalUpi);

            } catch (err) {
                console.error("Failed to fetch transaction data:", err);
                setError(err.message || 'Failed to fetch data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchTransactionData();
        }
    }, [selectedDate, user, refreshSignal]);

    const handleDateChange = (event) => setSelectedDate(event.target.value);

    const displayTitle = selectedDate === getTodayDateString() ? "Today's Transactions" : `Transactions for ${selectedDate}`;

    return (
        <div className="money-collected-container">
            <div className="money-collected-header">
                <h3>{displayTitle}</h3>
                <div className="date-selector">
                     <label htmlFor="collection-date">Select Date: </label>
                     <input
                        type="date"
                        id="collection-date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        disabled={isLoading}
                     />
                 </div>
            </div>
            <div className="money-collected-body">
                {isLoading && <p>Loading data...</p>}
                {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
                {!isLoading && !error && (
                    <>
                        <div className="collection-section">
                            <h4>CASH</h4>
                            <p>Amount Collected: ₹{cashAmount.toFixed(2)}</p>
                        </div>
                        <div className="collection-section">
                             <h4>ONLINE / UPI</h4>
                             <p>Amount Collected: ₹{upiAmount.toFixed(2)}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MoneyCollected;