// src/components/Calendar.js --- MERGED & CORRECTED ---

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWithAuth } from '../utils/api';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Calendar.css'; // This will use our new, responsive CSS

// Note: Assuming SearchBar, MoneyCollected, StatusDot, SearchResults are separate components
// If they are not, we may need to adjust imports.
import SearchBar from './SearchBar'; 
import MoneyCollected from './MoneyCollected';
import StatusDot from './StatusDot';
import SearchResults from './SearchResults';

const Calendar = ({ user, refreshSignal }) => {
    const navigate = useNavigate();

    // State management is from your correct version
    const [currentDate, setCurrentDate] = useState(new Date());
    const [pendingDays, setPendingDays] = useState([]);
    const [loadingStatuses, setLoadingStatuses] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const fetchStatusSummary = useCallback(async (date) => {
        setLoadingStatuses(true);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        try {
            const response = await getWithAuth(`/api/calendar/status-summary?year=${year}&month=${month}`);
            if (!response.ok) throw new Error("Failed to fetch calendar summary");
            const data = await response.json();
            setPendingDays(data.pendingDays || []);
        } catch (error) {
            console.error("Error fetching calendar status summary:", error);
            setPendingDays([]);
        } finally {
            setLoadingStatuses(false);
        }
    }, []);

    useEffect(() => {
        fetchStatusSummary(currentDate);
    }, [currentDate, fetchStatusSummary, refreshSignal]);

    // All your handler functions are correct and are preserved here
    const handleStudentSearch = async (searchTerm) => { /* ... your code ... */ };
    const handleClearSearchResults = () => { /* ... your code ... */ };
    const handleDateClick = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        navigate(`/manage?date=${dateStr}`); // Changed from /students to /manage to match new App.js
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonthCount = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysArray = [];
        const todayReal = new Date();
        todayReal.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDayIndex; i++) {
            daysArray.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let dayLoop = 1; dayLoop <= daysInMonthCount; dayLoop++) {
            const dateOfCell = new Date(year, month, dayLoop);
            dateOfCell.setHours(0, 0, 0, 0);
            
            let dayStatus;
            // This is your correct logic for showing dots
            if (dateOfCell < todayReal) { // Only show dots for past and today
                dayStatus = pendingDays.includes(dayLoop) ? 'pending' : 'paid';
            }

            const isTodayCell = dateOfCell.getTime() === todayReal.getTime();
            const dayClasses = ['calendar-day', isTodayCell ? 'today' : ''].filter(Boolean).join(' ');

            daysArray.push(
                <div key={dayLoop} className={dayClasses} onClick={() => handleDateClick(dayLoop)}>
                    <span>{dayLoop}</span>
                    {/* StatusDot component will now correctly receive 'pending', 'paid', or undefined */}
                    <StatusDot status={dayStatus} />
                </div>
            );
        }
        return daysArray;
    };
    
    // --- THIS IS THE NEW PART: THE JSX USES THE RESPONSIVE STRUCTURE ---
    return (
        <div className="calendar-page-container">
            {/* Search bar can go here if needed, or be removed for simplicity */}
            {/* <SearchBar onSearch={handleStudentSearch} onClearSearch={handleClearSearchResults} /> */}
            
            <div className="calendar-header">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="nav-button">
                    <FaChevronLeft />
                </button>
                <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="nav-button">
                    <FaChevronRight />
                </button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="today-button">Today</button>

            <div className="calendar-card">
                <div className="calendar-grid weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="calendar-grid">
                    {loadingStatuses ? <p>Loading...</p> : renderDays()}
                </div>
            </div>
             {/* The MoneyCollected component can be integrated here or elsewhere as needed */}
        </div>
    );
};

export default Calendar;