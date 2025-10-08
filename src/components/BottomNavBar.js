// src/components/BottomNavBar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUserPlus, FaUsers, FaPaperPlane, FaChevronUp } from 'react-icons/fa';
import './BottomNavBar.css';

const BottomNavBar = ({ onMoreClick }) => {
    return (
        <nav className="bottom-nav-bar">
            <div className="nav-items-container">
                <NavLink to="/" className="nav-item" end>
                    <FaHome className="nav-icon" />
                    <span className="nav-label">Home</span>
                </NavLink>

                <NavLink to="/add-member" className="nav-item">
                    <FaUserPlus className="nav-icon" />
                    <span className="nav-label">Add</span>
                </NavLink>

                <NavLink to="/all-members" className="nav-item">
                    <FaUsers className="nav-icon" />
                    <span className="nav-label">Members</span>
                </NavLink>
                
                <NavLink to="/reminders" className="nav-item">
                    <FaPaperPlane className="nav-icon" />
                    <span className="nav-label">Reminders</span>
                </NavLink>

                <button onClick={onMoreClick} className="nav-item nav-item-button">
                    <FaChevronUp className="nav-icon" />
                    <span className="nav-label">More</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNavBar;