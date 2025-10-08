// src/components/SearchResults.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css'; // This contains the styles we need

const SearchResults = ({ results, error, loading }) => {
    const navigate = useNavigate();

    const handleResultClick = (studentId) => {
        navigate(`/student-profile/${studentId}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    return (
        <div className="search-results-container">
            {loading && <p className="no-results-message">Searching...</p>}
            {error && <p className="no-results-message">{error}</p>}
            
            {!loading && !error && (
                <>
                    {results.length === 0 ? (
                        <p className="no-results-message">No members found.</p>
                    ) : (
                        results.map(student => (
                            <div 
                                key={student.id} 
                                className="student-result-item"
                                onClick={() => handleResultClick(student.id)}
                            >
                                <span className="student-result-name">{student.name}</span>
                                
                                <span className="student-result-info">Admission: {formatDate(student.admission_date)}</span>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    );
};

export default SearchResults;