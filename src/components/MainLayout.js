// src/components/MainLayout.js --- UPDATED TO ACCEPT PROPS ---

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DesktopHeader from './DesktopHeader';
import './MainLayout.css';

// Accept props from App.js
const MainLayout = ({ user, onLogout, onSetPaymentClick }) => {
    return (
        <div className="main-layout">
            {/* Pass props down to the Sidebar */}
            <Sidebar onLogout={onLogout} onSetPaymentClick={onSetPaymentClick} />
            
            <div className="content-wrapper">
                {/* Pass the user prop to the Header */}
                <DesktopHeader user={user} />
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;