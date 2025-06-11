// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <-- Import Link for navigation

// Remove hardcoded token check from here
// const CORRECT_ADMIN_TOKEN = '...';

function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState(''); // <-- Add username state
  const [password, setPassword] = useState(''); // <-- Rename from tokenInput
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', { // <-- Call login API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // <-- Send username/password
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Login failed with status: ${response.status}`);
      }

      // Login successful - response includes the token
      if (data.token) {
        localStorage.setItem('authToken', data.token); // <-- Store the JWT
        onLoginSuccess(); // Call parent callback
      } else {
        throw new Error('Login successful, but no token received.'); // Should not happen
      }

    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message);
      localStorage.removeItem('authToken'); // Clear any old token on failure
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold text-center mb-6">Admin Login</h2>
      <form onSubmit={handleLogin}>
        {/* Username Field */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter username"
          />
        </div>
        {/* Password Field */}
        <div className="mb-4">
          <label htmlFor="password"/* Renamed from admin-token */ className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            id="password" /* Renamed */
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter password"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
         {/* Add Link to Register Page later */}
         {/* <p className="text-xs text-center mt-4">Need an account? <Link to="/register" className="text-indigo-600 hover:underline">Register</Link></p> */}
      </form>
      {/* Add Link to Register Page */}
      <p className="text-sm text-center mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register here
            </Link>
      </p>
    </div>
  );
}

export default LoginForm;