// src/components/DesktopHeader.js --- SIMPLIFIED TO USE PROPS ---

import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './DesktopHeader.css';

const DesktopHeader = ({ user }) => {
    const username = user?.username || ''; // Get username from the user prop

    return (
        <header className="desktop-header">
            <div className="header-left-dummy"></div>
            <div className="header-right">
                <span className="welcome-text">Welcome, {username}</span>
                <Link to="/my-profile" className="profile-link">
                    <FaUserCircle className="profile-icon" />
                </Link>
            </div>
        </header>
    );
};

export default DesktopHeader;