// src/components/BottomNavBar.js --- UPDATED WITH NEW ICONS ---

import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNavBar.css';

// Import a new set of icons that support both solid and outline styles
import { 
    IoHome, IoHomeOutline, 
    IoAdd, 
    IoPeople, IoPeopleOutline,
    IoPaperPlane, IoPaperPlaneOutline,
    IoEllipsisHorizontal 
} from 'react-icons/io5';

const BottomNavBar = ({ onMoreClick }) => {
    // A helper component to avoid repetition
    const NavItemIcon = ({ isActive, ActiveIcon, InactiveIcon }) => {
        return isActive ? <ActiveIcon className="nav-icon" /> : <InactiveIcon className="nav-icon" />;
    };

    return (
        <nav className="bottom-nav-bar">
            <div className="nav-items-container">
                <NavLink to="/" className="nav-item" end>
                    {({ isActive }) => (
                        <>
                            <NavItemIcon isActive={isActive} ActiveIcon={IoHome} InactiveIcon={IoHomeOutline} />
                            <span className="nav-label">Home</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/add-member" className="nav-item">
                     {/* For "Add", the icon doesn't need to change style */}
                    <IoAdd className="nav-icon" />
                    <span className="nav-label">Add</span>
                </NavLink>

                <NavLink to="/all-members" className="nav-item">
                    {({ isActive }) => (
                        <>
                            <NavItemIcon isActive={isActive} ActiveIcon={IoPeople} InactiveIcon={IoPeopleOutline} />
                            <span className="nav-label">Members</span>
                        </>
                    )}
                </NavLink>
                
                <NavLink to="/reminders" className="nav-item">
                    {({ isActive }) => (
                        <>
                            <NavItemIcon isActive={isActive} ActiveIcon={IoPaperPlane} InactiveIcon={IoPaperPlaneOutline} />
                            <span className="nav-label">Reminders</span>
                        </>
                    )}
                </NavLink>

                <button onClick={onMoreClick} className="nav-item nav-item-button">
                    <IoEllipsisHorizontal className="nav-icon" />
                    <span className="nav-label">More</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNavBar;