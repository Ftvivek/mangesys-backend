// src/components/MoneyCollected.js
// --- COMPLETE MODIFIED VERSION ---

import React, { useState, useEffect } from 'react';
import './MoneyCollected.css';
import { getWithAuth } from '../utils/api'; 

const getTodayDateString = () => new Date().toLocaleDateString('en-CA');

// --- CHANGE 1: ACCEPT THE `refreshSignal` PROP ---
const MoneyCollected = ({ user, refreshSignal }) => {
    const [cashAmount, setCashAmount] = useState(0);
    const [onlineAmount, setOnlineAmount] = useState(0);
    const [cashStudentCount, setCashStudentCount] = useState(0);
    const [onlineStudentCount, setOnlineStudentCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    
    const paymentPerStudent = parseFloat(user?.set_payment) || 500;

    useEffect(() => {
        const fetchCollectionData = async () => {
            if (!selectedDate) {
                setError("Please select a valid date.");
                return;
            }
            setIsLoading(true);
            setError(null);
            
            // Reset values before fetching
            setCashAmount(0);
            setOnlineAmount(0);
            setCashStudentCount(0);
            setOnlineStudentCount(0);

            try {
                const response = await getWithAuth(`/api/collection/${selectedDate}`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();

                // --- Correct Calculation Logic ---
                const regularCashTotal = data.regularCashCount * paymentPerStudent;
                const finalCashAmount = regularCashTotal + data.newAdmissionTotalAmount;
                setCashAmount(finalCashAmount);

                const finalCashCount = data.regularCashCount + data.newAdmissionCount;
                setCashStudentCount(finalCashCount);

                const finalOnlineAmount = data.regularOnlineCount * paymentPerStudent;
                setOnlineAmount(finalOnlineAmount);
                
                setOnlineStudentCount(data.regularOnlineCount);

            } catch (err) {
                console.error("Failed to fetch collection data:", err);
                setError(err.message || 'Failed to fetch data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchCollectionData();
        }
    // --- CHANGE 2: ADD `refreshSignal` TO THE DEPENDENCY ARRAY ---
    }, [selectedDate, user, paymentPerStudent, refreshSignal]);

    const handleDateChange = (event) => setSelectedDate(event.target.value);

    const displayTitle = selectedDate === getTodayDateString() ? "Today's Collection" : `Collection for ${selectedDate}`;

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
                            <p className="count-details">({cashStudentCount} student{cashStudentCount !== 1 ? 's' : ''})</p>
                        </div>
                        <div className="collection-section">
                             <h4>ONLINE</h4>
                             <p>Amount Collected: ₹{onlineAmount.toFixed(2)}</p>
                             <p className="count-details">({onlineStudentCount} student{onlineStudentCount !== 1 ? 's' : ''})</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MoneyCollected;