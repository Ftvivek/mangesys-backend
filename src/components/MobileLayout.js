// src/components/MobileLayout.js --- VERIFIED FIX ---
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import BottomNavBar from './BottomNavBar';
import MoreOptionsMenu from './MoreOptionsMenu';
import './MobileLayout.css';

const MobileLayout = ({ user, onLogout }) => {
    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);

    return (
        <div className="mobile-layout">
            <MobileHeader user={user} />

            {/* The <Outlet/> must be a DIRECT child of mobile-main-content */}
            <main className="mobile-main-content">
                <Outlet />
            </main>

            <BottomNavBar onMoreClick={() => setMoreMenuOpen(true)} />

            <MoreOptionsMenu 
                isOpen={isMoreMenuOpen}
                onClose={() => setMoreMenuOpen(false)}
                onLogout={onLogout}
            />
        </div>
    );
};

export default MobileLayout;