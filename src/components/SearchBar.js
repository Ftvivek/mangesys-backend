// src/components/SearchBar.js

import React, { useState } from 'react';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import './SearchBar.css';

const SearchBar = ({ onSearch, onClearSearch }) => {
    // This component will now get the searchTerm from its parent
    // to make it fully controlled, but for simplicity, we'll leave its internal state
    // and just call the functions.
    
    // The existing code you provided is actually fine for this purpose.
    // The key is how the props (onSearch, onClearSearch) are used in Calendar.js.
    // No changes are strictly needed here if your existing SearchBar.js from the prompt is used.
    // However, for clarity, here is the original code again.
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleInputChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        if (value.trim() !== '') {
            setIsSearching(true);
        } else {
            setIsSearching(false);
            if (onClearSearch) {
                onClearSearch();
            }
        }
    };
    
    const handleSearchClick = () => {
        if (searchTerm.trim()) {
            onSearch(searchTerm.trim());
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchClick();
        }
    };

    const handleClear = () => {
        setSearchTerm('');
        setIsSearching(false);
        if (onClearSearch) {
            onClearSearch();
        }
    };

    return (
        <div className="search-bar-container">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search Member Name..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="search-input"
                />
                {isSearching ? (
                    <button onClick={handleClear} className="search-button"><FaArrowLeft /></button>
                ) : (
                    <button onClick={handleSearchClick} className="search-button"><FaSearch /></button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;