// src/components/MoreOptionsMenu.js --- UPDATED WITH ALL OPTIONS ---

import React from 'react';
import { Link } from 'react-router-dom';
// Import the icons needed, consistent with the desktop sidebar
import { FaEnvelope, FaTags, FaCog, FaSignOutAlt, FaDolly } from 'react-icons/fa';
import './MoreOptionsMenu.css';

// Accept the new onSetPaymentClick prop
const MoreOptionsMenu = ({ isOpen, onClose, onLogout, onSetPaymentClick }) => {
    if (!isOpen) {
        return null;
    }

    const handleMenuClick = (e) => {
        e.stopPropagation();
    };

    // A helper function to ensure the menu closes after the action
    const handleSetPayment = () => {
        onSetPaymentClick();
        onClose();
    };

    return (
        <div className="more-menu-backdrop" onClick={onClose}>
            <div className="more-menu-content" onClick={handleMenuClick}>
                <ul className="more-menu-list">
                    {/* --- NEW ITEM: Transaction --- */}
                    <li>
                        <Link to="/transactions" className="menu-link" onClick={onClose}>
                            <FaDolly className="menu-icon" />
                            <span>Transaction</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/contact" className="menu-link" onClick={onClose}>
                            <FaEnvelope className="menu-icon" />
                            <span>Contact Us</span>
                        </Link>
                    </li>
                    <li>
                        <button onClick={handleSetPayment} className="menu-link menu-button">
                            <FaTags className="menu-icon" />
                            <span>Set Payments</span>
                        </button>
                    </li>
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