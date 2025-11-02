// src/App.js --- MODIFIED VERSION ---

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Corrected Component Imports ---
import MainLayout from './components/MainLayout';
import MobileLayout from './components/MobileLayout';
import Calendar from './components/Calendar';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import StudentManagement from './components/StudentManagement';
import StudentProfile from './components/StudentProfile';
import AdminUserManagementPage from './components/AdminUserManagementPage';
import SubscriptionExpiredPage from './components/SubscriptionExpiredPage';
import SetPaymentModal from './components/SetPaymentModal';
import AddStudentForm from './components/AddStudentForm';
import AllStudentList from './components/AllStudentList';
import ContactUsPage from './components/ContactUsPage';
import SettingsPage from './components/SettingsPage';
import RemindersPage from './components/RemindersPage';
import AdminProfilePage from './components/AdminProfilePage';
import LogsPage from './components/LogsPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsAndConditionsPage from './components/TermsAndConditionsPage';
import FinancialReportPage from './components/FinancialReportPage'; 
import MoneyCollected from './components/MoneyCollected'; // Import MoneyCollected

// --- Import Utilities and Hooks ---
import { isAuthenticated, getUserData, logout as authLogout } from './utils/auth';
import useScreenSize from './hooks/useScreenSize';

// --- Private Route Wrapper ---
const PrivateRoute = ({ user, onLogout, onSetPaymentClick }) => {
    const isMobile = useScreenSize();
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    const LayoutComponent = isMobile ? MobileLayout : MainLayout;
    return <LayoutComponent user={user} onLogout={onLogout} onSetPaymentClick={onSetPaymentClick} />;
};

// --- Admin Route Wrapper ---
const AdminRouteWrapper = () => {
    const user = getUserData();
    return isAuthenticated() && user?.is_admin ? <AdminUserManagementPage /> : <Navigate to="/" replace />;
};

function App() {
    const [user, setUser] = useState(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [calendarRefreshSignal, setCalendarRefreshSignal] = useState(0);

    useEffect(() => {
        if (isAuthenticated()) {
            setUser(getUserData());
        }
    }, []);

    const handleLoginSuccess = (userData) => { setUser(userData); };
    const handleLogout = () => {
        authLogout();
        setUser(null);
        window.location.href = '/login';
    };
    const handlePaymentUpdated = (newPaymentAmount) => {
        const updatedUser = { ...user, set_payment: newPaymentAmount };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
    };
    const triggerCalendarRefresh = () => { setCalendarRefreshSignal(prev => prev + 1); };

    return (
        <Router>
            <Routes>
                {/* --- Public Routes --- */}
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/register" element={<RegistrationPage />} />
                
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                
                {/* --- Private Routes --- */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute 
                            user={user} 
                            onLogout={handleLogout} 
                            onSetPaymentClick={() => setPaymentModalOpen(true)}
                        />
                    }
                >
                    <Route index element={<Calendar user={user} refreshSignal={calendarRefreshSignal} />} />
                    <Route path="add-member" element={<AddStudentForm onStudentAdded={triggerCalendarRefresh} />} />
                    <Route path="all-members" element={<AllStudentList />} />
                    <Route path="my-profile" element={<AdminProfilePage />} />
                    <Route path="contact" element={<ContactUsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="manage" element={<StudentManagement onPaymentSuccess={triggerCalendarRefresh} />} />
                    <Route path="student-profile/:id" element={<StudentProfile />} />
                    <Route path="subscription-expired" element={<SubscriptionExpiredPage />} />
                    <Route path="financial-report" element={<FinancialReportPage />} />
                    <Route path="reminders" element={<RemindersPage />} />
                    <Route path="logs" element={<LogsPage />} />
                    {/* --- NEW TRANSACTION ROUTE --- */}
                    <Route path="transactions" element={<MoneyCollected user={user} refreshSignal={calendarRefreshSignal} />} />
                    <Route path="admin" element={<AdminRouteWrapper />} />
                </Route>

                {/* --- Fallback Route --- */}
                <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/login"} replace />} />
            </Routes>

            {/* --- Modals --- */}
            {isPaymentModalOpen && user && (
                <SetPaymentModal 
                    currentPayment={user.set_payment}
                    onClose={() => setPaymentModalOpen(false)}
                    onPaymentUpdated={handlePaymentUpdated}
                />
            )}
        </Router>
    );
}

export default App;