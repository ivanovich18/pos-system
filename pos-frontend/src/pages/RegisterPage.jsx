// src/pages/RegisterPage.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import useNavigate and Link
import RegisterForm from '../components/RegisterForm';

function RegisterPage() {
  const navigate = useNavigate(); // Hook for navigation

  const handleSuccess = () => {
    // Optionally show success message for a bit before redirecting
    setTimeout(() => {
      navigate('/admin/products'); // Navigate to login (or maybe dashboard?) after delay
    }, 1500); // Redirect after 1.5 seconds
  };

  return (
    <div>
      {/* Pass the handleSuccess function to the form */}
      <RegisterForm onRegisterSuccess={handleSuccess} />

      {/* Add link back to login */}
      <p className="text-center text-sm mt-4">
        Already have an account?{' '}
        <Link to="/admin/products" className="font-medium text-indigo-600 hover:text-indigo-500">
          Login here
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;