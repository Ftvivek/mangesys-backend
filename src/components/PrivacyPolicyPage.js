// src/components/PrivacyPolicyPage.js --- NEW FILE ---

import React from 'react';
import './LegalPage.css'; // We'll create a shared CSS file

const PrivacyPolicyPage = () => {
    return (
        <div className="legal-page-container">
            <h1>Privacy Policy</h1>
            <p><strong>Last updated: Jan 2025</strong></p>

            <h2>1. Introduction</h2>
            <p>
                Welcome to Mangesys. We are committed to protecting your personal information and your right to privacy. 
                If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
            </p>
            
            <h2>2. Information We Collect</h2>
            <p>
                We collect personal information that you voluntarily provide to us when you register on the application, 
                express an interest in obtaining information about us or our products and services, when you participate in activities on the application or otherwise when you contact us.
                The personal information we collect includes: Usernames, Passwords, Business Names, and Mobile Numbers.
            </p>

            {/* !!! IMPORTANT: REPLACE THE REST OF THIS WITH YOUR ACTUAL PRIVACY POLICY !!! */}
            <h2>3. How We Use Your Information</h2>
            <p>We may use your data for analytical and research purpose.</p>

            <h2>4. Will Your Information Be Shared With Anyone?</h2>
            <p>your , all data won't be shared with anyone at any cost.</p>

            <h2>5. Contact Us</h2>
            <p>
                If you have questions or comments about this policy, you may email us at contact@mivansindustries.space
            </p>
        </div>
    );
};

export default PrivacyPolicyPage;