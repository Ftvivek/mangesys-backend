// src/components/ContentHeader.js
import React from 'react';
import './ContentHeader.css';
import { HiMenu } from 'react-icons/hi';
import { FaUserCircle } from 'react-icons/fa';

const ContentHeader = ({ user, onMenuClick }) => {
    return (
        <header className="content-header-container">
            <button className="mobile-menu-button" onClick={onMenuClick}>
                <HiMenu />
            </button>

            <div className="user-info-section">
                <span>Welcome, {user ? user.username : 'Guest'}</span>
                <FaUserCircle className="user-icon" />
            </div>
        </header>
    );
};

export default ContentHeader;