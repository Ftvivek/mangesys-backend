// src/components/SetPaymentModal.js
import React, { useState } from 'react';
import { putWithAuth } from '../utils/api';
import './SetPaymentModal.css';

const SetPaymentModal = ({ currentPayment, onClose, onPaymentUpdated }) => {
    const [amount, setAmount] = useState(currentPayment || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(false);
        const newAmount = parseFloat(amount);
        if (isNaN(newAmount) || newAmount < 0) {
            setError('Please enter a valid, non-negative number.');
            return;
        }
        setLoading(true);
        try {
            const response = await putWithAuth('/api/user/payment-setting', {
                newPaymentAmount: newAmount
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update payment setting.');
            }
            const data = await response.json();
            setSuccess(true);
            onPaymentUpdated(data.user.set_payment);
            setTimeout(() => { onClose(); }, 1500);
        } catch (err) { setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Set Payment Amount</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="payment-amount">Default Payment Amount per Member</label>
                        <input type="number" id="payment-amount" value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 500" required min="0" step="0.01" />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">Payment amount updated successfully!</p>}
                    <div className="modal-actions">
                        <button type="button" className="button-cancel" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="button-submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Amount'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SetPaymentModal;