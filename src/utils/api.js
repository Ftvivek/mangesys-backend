// src/utils/api.js

// Using REACT_APP_API_URL is the best practice for production.
// The hardcoded IP is just for our current local test.
const API_BASE_URL ='http://localhost:5000';
//const API_BASE_URL ='https://d7ev4pcik9hdv.cloudfront.net';
// ========================================================================
// --- NEW: FUNCTION FOR PUBLIC (NON-AUTHENTICATED) REQUESTS ---
// This will be used for Login and Registration pages.
// It does NOT have the special 401 redirect logic.
// ========================================================================
export const postPublic = async (endpoint, body) => {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        // We simply return whatever response we get from the server.
        return response;
    } catch (error) {
        // This will catch network errors (e.g., server is down).
        console.error('Public API call failed:', error);
        throw error;
    }
};


// ========================================================================
// --- EXISTING: FUNCTION FOR AUTHENTICATED REQUESTS ---
// This is for all API calls AFTER a user has logged in.
// It correctly handles expired tokens by redirecting to the login page.
// ========================================================================
export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // This block handles both JSON objects and FormData for file uploads.
    if (options.body) {
        if (options.body instanceof FormData) {
            // FormData sets its own Content-Type, so we don't add it.
        } else {
            // For plain objects, we set the header and stringify the body.
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // This logic is INTENDED for logged-in users. 
        // If a token is bad, log them out. This is correct for this function.
        if (response.status === 401 || response.status === 403) {
            console.error('Auth error:', response.status, 'Redirecting to login.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = '/login';
            throw new Error(`Authentication failed: ${response.status}`);
        }

        return response;

    } catch (error) {
        // This will catch the auth error thrown above or network errors.
        console.error('API call failed:', error);
        throw error;
    }
};

// --- HELPER FUNCTIONS that use fetchWithAuth (for authenticated routes) ---

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