// src/utils/api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        // Spread existing headers from options
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Automatically set Content-Type for JSON if body is an object and not FormData
    // FormData sets its own Content-Type with boundary
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body); // Ensure body is stringified
    }


    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { // Prepend API_BASE_URL
            ...options,
            headers,
        });

        // If token is invalid or expired, backend should return 401 or 403
        if (response.status === 401 || response.status === 403) {
            console.error('Auth error:', response.status, 'Redirecting to login.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            // Simple redirect. For more complex apps, you might use a global state/context for this.
            window.location.href = '/login';
            // Throw an error to stop further processing in the calling function
            throw new Error(`Authentication failed: ${response.status}`);
        }

        // IMPORTANT: The component calling this will need to handle .json() itself
        // e.g., const res = await getWithAuth('/my-data'); const data = await res.json();
        return response; // Return the full response object

    } catch (error) {
        // Handle network errors or the auth error thrown above
        console.error('API call failed:', error);
        // Re-throw the error so the calling component can handle it
        throw error;
    }
};

// Helper functions that call fetchWithAuth
export const getWithAuth = (endpoint, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'GET', cache: 'no-store' });
};

export const postWithAuth = (endpoint, body, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'POST', body });
};

export const putWithAuth = (endpoint, body, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'PUT', body });
};

export const deleteWithAuth = (endpoint, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'DELETE' });
};