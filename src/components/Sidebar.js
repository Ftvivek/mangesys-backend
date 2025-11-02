// src/components/Sidebar.js --- CORRECTED TO WORK WITH NEW APP.JS ---

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FaTachometerAlt, FaUserPlus, FaUsers, FaEnvelope, 
    FaBell, FaCog, FaTags, FaSignOutAlt, FaChartLine, FaDolly // New Icon
} from 'react-icons/fa';
import './Sidebar.css';

// The component now accepts props from its parent (MainLayout -> App.js)
const Sidebar = ({ onLogout, onSetPaymentClick }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-logo">Mangesys</h1>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/" className="nav-link" end>
                    <FaTachometerAlt className="nav-icon" /><span>Dashboard</span>
                </NavLink>
                <NavLink to="/add-member" className="nav-link">
                    <FaUserPlus className="nav-icon" /><span>Add Member</span>
                </NavLink>
                <NavLink to="/all-members" className="nav-link">
                    <FaUsers className="nav-icon" /><span>View All Members</span>
                </NavLink>
                <NavLink to="/financial-report" className="nav-link">
                    <FaChartLine className="nav-icon" /><span>Financial Report</span>
                </NavLink>
                {/* --- NEW TRANSACTION LINK --- */}
                <NavLink to="/transactions" className="nav-link">
                    <FaDolly className="nav-icon" /><span>Transaction</span>
                </NavLink>
                
                <NavLink to="/reminders" className="nav-link">
                    <FaBell className="nav-icon" /><span>Reminder Status</span>
                </NavLink>
                <NavLink to="/settings" className="nav-link">
                    <FaCog className="nav-icon" /><span>Settings</span>
                </NavLink>
                <NavLink to="/contact" className="nav-link">
                    <FaEnvelope className="nav-icon" /><span>Contact Us</span>
                </NavLink>
                
                <button onClick={onSetPaymentClick} className="nav-link as-button">
                    <FaTags className="nav-icon" /><span>Set Payments</span>
                </button>
            </nav>
            <div className="sidebar-footer">
                <button onClick={onLogout} className="nav-link as-button logout-button">
                    <FaSignOutAlt className="nav-icon" /><span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;