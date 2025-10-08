// src/components/MobileLayout.js --- UPDATED TO ACCEPT PROPS ---

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import BottomNavBar from './BottomNavBar';
import MoreOptionsMenu from './MoreOptionsMenu';
import './MobileLayout.css';

// Accept props from App.js
const MobileLayout = ({ user, onLogout }) => {
    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);

    return (
        <div className="mobile-layout">
            {/* Pass the user prop to the Header */}
            <MobileHeader user={user} />

            <main className="mobile-main-content">
                <Outlet />
            </main>

            <BottomNavBar onMoreClick={() => setMoreMenuOpen(true)} />

            <MoreOptionsMenu 
                isOpen={isMoreMenuOpen}
                onClose={() => setMoreMenuOpen(false)}
                onLogout={onLogout} // Pass the logout handler from props
            />
        </div>
    );
};

export default MobileLayout;