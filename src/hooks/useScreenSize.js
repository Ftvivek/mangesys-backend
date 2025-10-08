// src/hooks/useScreenSize.js

import { useState, useEffect } from 'react';

const useScreenSize = () => {
    // Check the window width on initial load
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        // This function will be called whenever the window is resized
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Add the event listener
        window.addEventListener('resize', handleResize);

        // This is a cleanup function. It removes the event listener
        // when the component is no longer on the screen to prevent memory leaks.
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []); // The empty array [] means this effect runs only once on component mount

    return isMobile;
};

export default useScreenSize;