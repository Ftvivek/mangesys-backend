// src/components/SubscriptionExpiredPage.js
import React from 'react';
import { Link } from 'react-router-dom';
// import './SubscriptionExpiredPage.css'; // Create this CSS file for styling if needed

const SubscriptionExpiredPage = () => {
    const contactNumber = "9322354326"; // <<< IMPORTANT: Replace this
    // const contactEmail = "your.email@example.com"; // Optional: Add email

    return (
        <div className="subscription-expired-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh', // Take up most of the viewport height
            textAlign: 'center',
            padding: '20px',
            fontFamily: 'Arial, sans-serif' // Basic font
        }}>
            <h1 style={{ color: '#d9534f', marginBottom: '20px' }}>Access Expired</h1>
            <p style={{ fontSize: '1.2em', marginBottom: '15px' }}>
                Your access period for this application has unfortunately ended.
            </p>
            <p style={{ marginBottom: '25px' }}>
                To regain access and continue using our services, please contact administration to renew your subscription.
            </p>
            <div style={{
                padding: '20px',
                border: '1px solid #eee',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                maxWidth: '400px'
            }}>
                <h3 style={{ marginTop: '0', color: '#337ab7' }}>Contact Information:</h3>
                <p style={{ margin: '10px 0' }}>
                    Please reach out to us via the following:
                </p>
                <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '5px 0' }}>
                    Phone: {contactNumber}
                </p>
                {/* {contactEmail && (
                    <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '5px 0' }}>
                        Email: {contactEmail}
                    </p>
                )} */}
            </div>
            <p style={{ marginTop: '30px' }}>
                <Link to="/login" style={{
                    padding: '10px 20px',
                    backgroundColor: '#5cb85c',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '5px'
                }}>
                    Attempt to Log In Again
                </Link>
            </p>
        </div>
    );
};

export default SubscriptionExpiredPage;