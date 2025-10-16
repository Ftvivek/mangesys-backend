// src/components/Calendar.js --- FINAL CORRECTED VERSION ---

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWithAuth } from '../utils/api';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import useScreenSize from '../hooks/useScreenSize';
import StatusDot from './StatusDot';

// Conditionally import the correct CSS file
const isMobileScreen = window.innerWidth <= 768;
if (isMobileScreen) {
    require('./CalendarMobile.css');
} else {
    require('./Calendar.css');
}

const Calendar = ({ refreshSignal }) => {
    const navigate = useNavigate();
    const isMobile = useScreenSize();

    useEffect(() => {
        // This useEffect is to handle potential dynamic resizing.
    }, [isMobile]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [pendingDays, setPendingDays] = useState([]);
    const [loadingStatuses, setLoadingStatuses] = useState(true);

    const fetchStatusSummary = useCallback(async (date) => { // This 'date' is a parameter, it's correct.
        setLoadingStatuses(true);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        try {
            const response = await getWithAuth(`/api/calendar/status-summary?year=${year}&month=${month}`);
            if (!response.ok) throw new Error("Failed to fetch calendar summary");
            const data = await response.json();
            setPendingDays(data.pendingDays || []);
        } catch (error) { console.error("Error fetching calendar status summary:", error); }
        finally { setLoadingStatuses(false); }
    }, []);

    useEffect(() => {
        fetchStatusSummary(currentDate);
    }, [currentDate, fetchStatusSummary, refreshSignal]);

    const handleDateClick = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        navigate(`/manage?date=${dateStr}`);
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonthCount = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysArray = [];
        
        // FIX: Changed new date() to new Date()
        const todayReal = new Date(); 
        todayReal.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDayIndex; i++) {
            daysArray.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let dayLoop = 1; dayLoop <= daysInMonthCount; dayLoop++) {
            // FIX: Changed new date() to new Date()
            const dateOfCell = new Date(year, month, dayLoop); 
            dateOfCell.setHours(0, 0, 0, 0);
            let dayStatus;
            if (dateOfCell < todayReal) {
                dayStatus = pendingDays.includes(dayLoop) ? 'pending' : 'paid';
            }
            const isTodayCell = dateOfCell.getTime() === todayReal.getTime();
            const dayClasses = ['calendar-day', isTodayCell ? 'today' : ''].filter(Boolean).join(' ');
            daysArray.push(
                <div key={dayLoop} className={dayClasses} onClick={() => handleDateClick(dayLoop)}>
                    <span>{dayLoop}</span>
                    <StatusDot status={dayStatus} />
                </div>
            );
        }
        return daysArray;
    };
    
    return (
        <div className="calendar-page-container">
            <div className="calendar-header">
                {/* FIX: Changed new date() to new Date() */}
                <button className="nav-button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}><FaChevronLeft /></button>
                <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                {/* FIX: Changed new date() to new Date() */}
                <button className="nav-button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}><FaChevronRight /></button>
            </div>
            {/* FIX: Changed new date() to new Date() */}
            <button className="today-button" onClick={() => setCurrentDate(new Date())}>Today</button>
            <div className="weekdays">
                <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
            </div>
            <div className="calendar-grid">
                {loadingStatuses ? <p>Loading...</p> : renderDays()}
            </div>
        </div>
    );
};

export default Calendar;