// src/components/Navbar.js (FINAL VERSION WITH REMINDERS LINK)

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css'; 
import { HiMenu } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { FaUserShield } from 'react-icons/fa';

const Navbar = ({ user, onLogout, onSetPaymentClick, onAddStudentClick, onViewAllStudentsClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    // We only need wrappers for menu items to close the menu
    const handleSetPaymentsClick = () => {
        onSetPaymentClick();
        setIsMenuOpen(false);
    };

    const handleLogoutClick = () => {
        setIsMenuOpen(false);
        onLogout();
    };

    const handleAdminClick = () => {
        navigate('/admin/users');
    };
    
    // Handlers to ensure menu closes when these actions are triggered
    const handleAddStudentClick = () => {
        onAddStudentClick();
        setIsMenuOpen(false);
    };

    const handleViewAllStudentsClick = () => {
        onViewAllStudentsClick();
        setIsMenuOpen(false);
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    <button className="menu-button" onClick={() => setIsMenuOpen(true)}>
                        <HiMenu />
                    </button>
                    
                    <div className="navbar-brand">
                        <NavLink to="/"></NavLink>
                    </div>

                    <div className="navbar-center-actions">
                        {user && user.is_admin && (
                            <button onClick={handleAdminClick} className="navbar-admin-btn" title="Admin Management">
                                <FaUserShield /> 
                                <span>Admin Panel</span>
                            </button>
                        )}
                    </div>

                    <div className="navbar-user-section">
                        {user && (
                            <span className="welcome-message">Welcome, {user.username}</span>
                        )}
                    </div>
                </div>
            </nav>

            {isMenuOpen && <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>}

            <div className={`side-menu ${isMenuOpen ? 'active' : ''}`}>
                <div className="side-menu-header">
                    <h3>Menu</h3>
                    <button className="close-menu-button" onClick={() => setIsMenuOpen(false)}>
                        <IoClose />
                    </button>
                </div>
                <ul className="side-menu-links">
                    <li>
                        <button className="side-menu-item" onClick={handleAddStudentClick}>
                            Add Member
                        </button>
                    </li>
                    <li>
                        <button className="side-menu-item" onClick={handleViewAllStudentsClick}>
                            View All Member
                        </button>
                    </li>

                    <li>
                        <NavLink to="/contact" className="side-menu-item" onClick={() => setIsMenuOpen(false)}>
                            Contact Us
                        </NavLink>
                    </li>

                    {/* ====================================================== */}
                    {/* === THIS IS THE NEW LINK THAT WAS MISSING === */}
                    <li>
                        <NavLink to="/reminders" className="side-menu-item" onClick={() => setIsMenuOpen(false)}>
                            Reminders Status
                        </NavLink>
                    </li>
                    {/* ====================================================== */}
                    
                    <hr className="side-menu-divider" />
                    
                    <li>
                        <button className="side-menu-item" onClick={handleSetPaymentsClick}>
                            Set Payments
                        </button>
                    </li>
                    {user && user.is_admin && (
                         <li>
                             <NavLink to="/admin/users" className="side-menu-item" onClick={() => setIsMenuOpen(false)}>
                                 Admin Panel
                             </NavLink>
                         </li>
                    )}

                    <hr className="side-menu-divider" />
                    <li>
                        <NavLink to="/settings" className="side-menu-item" onClick={() => setIsMenuOpen(false)}>
                            Settings
                        </NavLink>
                    </li>

                    <li>
                        <button className="side-menu-item logout" onClick={handleLogoutClick}>
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </>
    );
};

export default Navbar;