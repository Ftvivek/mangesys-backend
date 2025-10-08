// src/components/AllStudentList.js --- FINAL VERSION WITH MAKE ACTIVE BUTTON ---

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import './AllStudentList.css';
import { getWithAuth, putWithAuth } from '../utils/api'; // putWithAuth is needed

const AllStudentList = () => {
    const [allStudents, setAllStudents] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    const navigate = useNavigate();

    const fetchAllStudents = async () => {
        setLoading(true); // Show loading indicator during refetch
        try {
            const response = await getWithAuth('/api/students');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            setAllStudents(data);
        } catch (err) {
            setError('Failed to load members. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllStudents();
    }, []);

    const handleSearch = (searchTerm) => {
        setIsSearching(true);
        const results = allStudents.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(results);
    };

    const handleClearSearch = () => {
        setIsSearching(false);
        setSearchResults([]);
    };

    // --- NEW: Function to handle making a student active ---
    const handleMakeActive = async (studentId, event) => {
        event.stopPropagation(); // Prevents navigating to the profile page
        
        if (!window.confirm("Are you sure you want to make this member active? This will remove their suspension status.")) {
            return;
        }

        try {
            const response = await putWithAuth(`/api/students/${studentId}/make-active`, {});
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to update status.');
            }
            // On success, refetch the entire list to see the change reflected
            await fetchAllStudents();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const { activeStudents, suspendedStudents } = useMemo(() => {
        const sourceList = isSearching ? searchResults : allStudents;
        const active = sourceList.filter(student => !student.is_suspended);
        const suspended = sourceList.filter(student => student.is_suspended);
        return { activeStudents: active, suspendedStudents: suspended };
    }, [allStudents, searchResults, isSearching]);

    if (loading) return <div className="all-students-list-container"><p>Loading members...</p></div>;
    if (error) return <div className="all-students-list-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="all-students-list-container">
            <h2>All Members</h2>
            <SearchBar onSearch={handleSearch} onClearSearch={handleClearSearch} />

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active ({activeStudents.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'suspended' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suspended')}
                >
                    Suspended ({suspendedStudents.length})
                </button>
            </div>

            <div className="list-content">
                {activeTab === 'active' && (
                    <div className="student-list-section">
                        {activeStudents.length > 0 ? (
                            <ul className="student-list">
                                {activeStudents.map(student => (
                                    <li key={student.id} className="student-item" onClick={() => navigate(`/student-profile/${student.id}`)}>
                                        <span className="student-name">{student.name}</span>
                                        <span className="student-info">
                                            Admission: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="no-members-message">No active members found.</p>}
                    </div>
                )}

                {activeTab === 'suspended' && (
                    <div className="student-list-section">
                        {suspendedStudents.length > 0 ? (
                            <ul className="student-list">
                                {suspendedStudents.map(student => (
                                    <li key={student.id} className="student-item" onClick={() => navigate(`/student-profile/${student.id}`)}>
                                        <span className="student-name">{student.name}</span>
                                        {/* --- THIS IS THE NEW PART --- */}
                                        <button 
                                            className="make-active-btn" 
                                            onClick={(e) => handleMakeActive(student.id, e)}
                                        >
                                            Make Active
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="no-members-message">No members are currently suspended.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllStudentList;