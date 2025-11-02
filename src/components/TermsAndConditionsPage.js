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
            <p>your account are your private ownership do not share the account credentials with any one, they are highly secure can't even be logined by admin's , so use wisely.</p>

            <h2>3. Subscriptions and Payments</h2>
            <p>This application is only be used when you have its subscription, cost will be displayed on the payment portal of razorpay, if you have any query you can visit to contat us we will help with the issue.</p>

            <h2>4. Prohibited Activities</h2>
            <p>The application is made for business owners or kind of firms who are the head of the departments ,any kind of activity that found to illegal actions lead to cancellation of the subscription.</p>
            
            <h2>5. Contact Information</h2>
            <p>
                For any questions regarding these terms, please contact us at contact@mivansindustries.space .
            </p>
        </div>
    );
};

export default TermsAndConditionsPage;