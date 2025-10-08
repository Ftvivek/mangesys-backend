// src/components/AdminUserManagementPage.js

import React, { useState, useEffect } from 'react';
import { getWithAuth, putWithAuth } from '../utils/api'; // Ensure putWithAuth is implemented
import './AdminUserManagementPage.css'; // Create this CSS file for table styles

const AdminUserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionStatus, setActionStatus] = useState({}); // To show feedback per user: { [userId]: 'loading' | 'success' | 'error' }

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getWithAuth('/api/admin/users');
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errData.error || `Failed to fetch users: ${response.status}`);
            }
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleActivateUser = async (userId) => {
        setActionStatus(prev => ({ ...prev, [userId]: 'loading' }));
        try {
            const response = await putWithAuth(`/api/admin/users/${userId}/activate`, {}); // Empty body for this PUT
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'Server error' }));
                setActionStatus(prev => ({ ...prev, [userId]: 'error' }));
                throw new Error(errData.error || `Failed to activate user: ${response.status}`);
            }
            setActionStatus(prev => ({ ...prev, [userId]: 'success' }));
            fetchUsers(); // Re-fetch users to show updated status and expiry
            setTimeout(() => setActionStatus(prev => ({ ...prev, [userId]: null })), 3000); // Clear status after 3s
        } catch (err) {
            console.error(`Error activating user ${userId}:`, err);
            setActionStatus(prev => ({ ...prev, [userId]: 'error' }));
            alert(`Failed to activate user: ${err.message}`); // Simple alert
        }
    };

    const handleSuspendUser = (userId) => {
        console.log(`Suspend button clicked for user ID: ${userId}. (Functionality not yet implemented)`);
        // For now, this button does nothing.
    };

    if (loading) return <p>Loading users...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div className="admin-user-management-page">
            <h2>Admin - User Management</h2>
            <button onClick={fetchUsers} style={{ marginBottom: '20px' }}>Refresh User List</button>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Business Name</th>
                        <th>Mobile No</th>
                        <th>Is Active?</th>
                        <th>Expires On</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td data-label="ID">{user.id}</td>
                            <td data-label="Username">{user.username}</td>
                            <td data-label="Business Name">{user.business_name || 'N/A'}</td>
                            <td data-label="Mobile No">{user.mobile_no || 'N/A'}</td>
                            <td data-label="Is Active?" style={{ color: user.is_active ? 'var(--color-status-success)' : 'var(--color-status-error)', fontWeight: 'bold' }}>
                                {user.is_active ? 'Yes' : 'No'}
                            </td>
                            <td data-label="Expires On">{user.access_expires_on || 'N/A'}</td>
                            <td data-label="Actions">
                                <button
                                    onClick={() => handleActivateUser(user.id)}
                                    disabled={actionStatus[user.id] === 'loading'}
                                    className="action-button activate" // Use classes for styling
                                >
                                    {actionStatus[user.id] === 'loading' ? 'Activating...' : 'Activate (1 Month)'}
                                </button>
                                <button
                                    onClick={() => handleSuspendUser(user.id)}
                                    className="action-button suspend" // Use classes for styling
                                >
                                    Suspend (No-Op)
                                </button>
                                {actionStatus[user.id] === 'success' && <span style={{ color: 'var(--color-status-success)', marginLeft: '5px', fontWeight: 'bold' }}>✓ Success</span>}
                                {actionStatus[user.id] === 'error' && <span style={{ color: 'var(--color-status-error)', marginLeft: '5px', fontWeight: 'bold' }}>✗ Error</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserManagementPage;