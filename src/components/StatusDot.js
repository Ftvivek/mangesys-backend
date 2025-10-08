// src/components/StatusDot.js

import React from 'react';

const StatusDot = ({ status }) => {
    // If there is no status (e.g., for future dates), render nothing.
    if (!status) {
        return null;
    }

    // Determine the class based on the status prop.
    const dotClass = `status-dot ${status}`; // e.g., "status-dot pending"

    return <div className={dotClass}></div>;
};

export default StatusDot;