// src/components/PublicNavbar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import './PublicNavbar.css'; // We'll create this CSS file next

const PublicNavbar = () => {
    return (
        <nav className="public-navbar">
            <div className="public-navbar-container">
                <div className="public-navbar-brand">
                    <NavLink to="/login">Management sys</NavLink>
                </div>
                <div className="public-navbar-actions">
                    <NavLink to="/contact" className="public-navbar-contact-link">
                        Contact Us
                    </NavLink>
                </div>
            </div>
        </nav>
    );
};

export default PublicNavbar;