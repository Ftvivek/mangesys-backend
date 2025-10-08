// src/components/MobileHeader.js --- SIMPLIFIED TO USE PROPS ---

import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './MobileHeader.css';

const MobileHeader = ({ user }) => {
    const username = user?.username || '';
    const displayUsername = username.charAt(0).toUpperCase() + username.slice(1);

    return (
        <header className="mobile-header">
            <div className="header-content">
                <h1 className="welcome-message">Welcome, {displayUsername}</h1>
                <Link to="/my-profile" className="profile-icon-link">
                    <FaUserCircle />
                </Link>
            </div>
        </header>
    );
};

export default MobileHeader;