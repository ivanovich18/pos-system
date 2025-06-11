// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correct named import

// Create the context
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
  // State to hold the auth token from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  // State to hold the decoded user information (or null if not logged in/invalid token)
  const [user, setUser] = useState(null);
  // State to track if the initial token check is complete
  const [loading, setLoading] = useState(true);

  // Effect runs when token changes (on load, login, logout)
  useEffect(() => {
    console.log("AuthContext Effect: Token changed or initial load. Token:", token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("AuthContext Effect: Decoded token:", decoded);

        // Optional but recommended: Check token expiration
        const nowInSeconds = Date.now() / 1000;
        if (decoded.exp && decoded.exp < nowInSeconds) {
          console.log("AuthContext Effect: Token expired.");
          localStorage.removeItem('authToken'); // Remove expired token
          setToken(null); // Clear token state
          setUser(null);  // Clear user state
        } else {
          // Token is valid (or doesn't have expiry), set user state
           setUser({
             id: decoded.userId, // Ensure these match payload keys from backend
             username: decoded.username,
             role: decoded.role
           });
        }
      } catch (error) {
        // If token is invalid or decoding fails
        console.error("AuthContext Effect: Failed to decode token:", error);
        localStorage.removeItem('authToken'); // Remove invalid token
        setToken(null);
        setUser(null);
      }
    } else {
      // No token found
      setUser(null); // Ensure user is null if no token
    }
    setLoading(false); // Finished initial auth check or token update processing
  }, [token]); // Re-run whenever the token state changes

  // Login function: saves token, triggers useEffect to update user
  const login = useCallback((newToken) => {
    if (newToken) {
        localStorage.setItem('authToken', newToken);
        setToken(newToken); // Update state, which triggers the useEffect
        console.log("AuthContext: login called, token set.");
    } else {
        console.error("AuthContext: login called with null/undefined token.");
        // Handle potential error case if needed
    }
  }, []);

  // Logout function: clears token and user state
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    console.log("AuthContext: logout called.");
    // Optionally navigate to login page here if needed globally
    // navigate('/login'); // Requires importing useNavigate from react-router-dom
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  // Provides state and functions to consuming components
  const value = useMemo(() => ({
    token,
    user, // Contains { id, username, role } or null
    isAuthenticated: !!user, // Simple check: true if user object exists
    loading, // True during initial token check
    login,
    logout,
  }), [token, user, loading, login, logout]); // Include login/logout callbacks

  // Provide the context value to children components
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily use the AuthContext in other components
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Check if the hook is used within an AuthProvider
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};