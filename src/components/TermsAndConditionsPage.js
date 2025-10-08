// src/components/TermsAndConditionsPage.js --- NEW FILE ---

import React from 'react';
import './LegalPage.css';

const TermsAndConditionsPage = () => {
    return (
        <div className="legal-page-container">
            <h1>Terms and Conditions</h1>
            <p><strong>Last updated: Jan 2025</strong></p>

            <h2>1. Agreement to Terms</h2>
            <p>
                By using our application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>

            {/* !!! IMPORTANT: REPLACE THE REST OF THIS WITH YOUR ACTUAL TERMS & CONDITIONS !!! */}
            <h2>2. User Accounts</h2>
            <p>Placeholder text: Describe rules about user accounts, responsibilities, etc...</p>

            <h2>3. Subscriptions and Payments</h2>
            <p>Placeholder text: Detail your payment terms, renewal policies, etc. This is important for Razorpay.</p>

            <h2>4. Prohibited Activities</h2>
            <p>Placeholder text: List what users are not allowed to do...</p>
            
            <h2>5. Contact Information</h2>
            <p>
                For any questions regarding these terms, please contact us at contact@mivansindustries.space .
            </p>
        </div>
    );
};

export default TermsAndConditionsPage;