// src/utils/auth.js --- COMPLETE AND CORRECTED ---

import { jwtDecode } from 'jwt-decode';

/**
 * Saves the authentication token and user data to localStorage.
 * @param {string} token - The JWT token.
 * @param {object} user - The user data object.
 */
export const saveAuthData = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
};

/**
 * Removes authentication data from localStorage to log the user out.
 */
export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
};

/**
 * Checks if a user is currently authenticated by seeing if a token exists.
 * @returns {boolean} - True if authenticated, false otherwise.
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    return !!token;
};

/**
 * Retrieves the raw JWT token from localStorage.
 * @returns {string|null} - The token, or null if not found.
 */
export const getToken = () => {
    return localStorage.getItem('authToken');
};

/**
 * Decodes the JWT token to get the username.
 * @returns {string|null} - The username, or null if not found or token is invalid.
 */
export const getUsername = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return null;
    }
    try {
        const decodedToken = jwtDecode(token);
        // Assumes the username is stored in 'user.username' within the token payload
        return decodedToken.user?.username || null;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
};

/**
 * Decodes the JWT token to get the full user data object.
 * THIS IS THE FUNCTION THAT WAS MISSING.
 * @returns {object|null} - The user data object, or null if not found or token is invalid.
 */
export const getUserData = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return null;
    }
    try {
        const decodedToken = jwtDecode(token);
        // Assumes the full user object is stored in the 'user' property of the token
        return decodedToken.user || null;
    } catch (error) {
        console.error("Failed to decode token for user data:", error);
        return null;
    }
};

/**
 * Checks if the logged-in user has admin privileges.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
export const isAdminUser = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return false;
    }
    try {
        const decodedToken = jwtDecode(token);
        return decodedToken.user?.is_admin === true;
    } catch (error) {
        return false;
    }
};