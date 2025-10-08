// src/components/MoreOptionsMenu.js

import React from 'react';
import { Link } from 'react-router-dom';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';
import './MoreOptionsMenu.css';

const MoreOptionsMenu = ({ isOpen, onClose, onLogout }) => {
    if (!isOpen) {
        return null;
    }

    // This stops a click inside the menu from closing it
    const handleMenuClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="more-menu-backdrop" onClick={onClose}>
            <div className="more-menu-content" onClick={handleMenuClick}>
                <ul className="more-menu-list">
                    <li>
                        <Link to="/settings" className="menu-link" onClick={onClose}>
                            <FaCog className="menu-icon" />
                            <span>Account Settings</span>
                        </Link>
                    </li>
                    <li>
                        <button onClick={onLogout} className="menu-link menu-button">
                            <FaSignOutAlt className="menu-icon" />
                            <span>Logout</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default MoreOptionsMenu;