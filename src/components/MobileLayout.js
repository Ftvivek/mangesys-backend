// src/components/MobileLayout.js --- UPDATE PROPS ---
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import BottomNavBar from './BottomNavBar';
import MoreOptionsMenu from './MoreOptionsMenu';
import './MobileLayout.css';

// Accept the new onSetPaymentClick prop here
const MobileLayout = ({ user, onLogout, onSetPaymentClick }) => {
    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);

    return (
        <div className="mobile-layout">
            <MobileHeader user={user} />

            <main className="mobile-main-content">
                <Outlet />
            </main>

            <BottomNavBar onMoreClick={() => setMoreMenuOpen(true)} />

            <MoreOptionsMenu 
                isOpen={isMoreMenuOpen}
                onClose={() => setMoreMenuOpen(false)}
                onLogout={onLogout}
                // Pass the new prop down to the menu component
                onSetPaymentClick={onSetPaymentClick}
            />
        </div>
    );
};

export default MobileLayout;