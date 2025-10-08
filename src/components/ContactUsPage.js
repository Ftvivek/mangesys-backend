// src/components/ContactUsPage.js
import React from 'react';
import './ContactUsPage.css';
import { FaPhone, FaEnvelope, FaUserTie } from 'react-icons/fa';

const ContactUsPage = () => {
    const adminName = "Vivek Pal";
    const phoneNumber = "9322354326";
    const emailAddress = "mivansindustries@gmail.com";

    return (
        <div className="contact-us-container">
            <h1>Contact Information</h1>
            <p className="intro-text">
                If you have any questions, need technical support, or want to discuss your subscription, please feel free to reach out to us.
            </p>
            
            <div className="contact-details">
                <div className="contact-item">
                    <div className="contact-icon-wrapper">
                        <FaUserTie className="contact-icon" />
                    </div>
                    <div className="contact-info">
                        <strong>Administrator</strong>
                        <span>{adminName}</span>
                    </div>
                </div>
                <div className="contact-item">
                    <div className="contact-icon-wrapper">
                        <FaPhone className="contact-icon" />
                    </div>
                    <div className="contact-info">
                        <strong>Phone</strong>
                        <span>{phoneNumber}</span>
                    </div>
                </div>
                <div className="contact-item">
                    <div className="contact-icon-wrapper">
                        <FaEnvelope className="contact-icon" />
                    </div>
                    <div className="contact-info">
                        <strong>Email</strong>
                        <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUsPage;