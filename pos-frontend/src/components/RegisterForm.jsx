// src/components/RegisterForm.jsx
import React, { useState } from 'react';

// Optional: Prop to call on successful registration (e.g., for navigation)
function RegisterForm({ onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For password confirmation
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // --- Client-side Validation ---
    if (!username || !password || !confirmPassword) {
      setError('All fields are required.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      const response = await fetch('/api/auth/register', { // Call register API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use error message from backend if available
        throw new Error(data.error || `Registration failed: ${response.statusText}`);
      }

      // Registration successful!
      setSuccessMessage(data.message || 'Registration successful! You can now log in.');
      // Clear form (optional)
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      // Call success callback if provided (e.g., to navigate)
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }

    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold text-center mb-6">Register New User</h2>
      <form onSubmit={handleRegister}>
        {/* Username */}
        <div className="mb-4">
          <label htmlFor="reg-username" /* Different id from login */ className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            id="reg-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Choose a username"
          />
        </div>
        {/* Password */}
        <div className="mb-4">
          <label htmlFor="reg-password" /* Different id */ className="block text-sm font-medium text-gray-700 mb-1">Password (min. 6 chars)</label>
          <input
            type="password"
            id="reg-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter password"
          />
        </div>
        {/* Confirm Password */}
        <div className="mb-6"> {/* Increased bottom margin */}
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Confirm password"
          />
        </div>

        {/* Display Area for Errors or Success */}
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm text-center mb-4">{successMessage}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default RegisterForm;