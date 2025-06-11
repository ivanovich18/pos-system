// src/App.jsx
import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom'; // Import Navigate
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import RegisterPage from './pages/RegisterPage';
// import LoginPage from './pages/LoginPage';

// Simple protected route component (can be moved to its own file)
function ProtectedAdminRoute({ children }) {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading authentication...</div>; // Or a spinner
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        // Redirect to login page if not authenticated admin
        console.log("Admin Route Guard: Access Denied. Redirecting.");
        // Pass current location so login can redirect back (optional)
        // return <Navigate to="/login" replace state={{ from: location }} />;
        // Or just redirect to login/home:
        return <Navigate to="/" replace />; // Or to your login route
    }

    return children; // Render the component if authenticated admin
}

function App() {
  const { isAuthenticated, user, isLoading } = useAuth(); // Get state for nav links

  // Handle initial auth loading for nav links display consistency
  const showAdminLinks = !isLoading && isAuthenticated && user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <nav className="bg-blue-600 p-4 text-white shadow-md">
        <ul className="flex space-x-4">
          <li><Link to="/" className="hover:underline">Home</Link></li>
          {isAuthenticated && ( /* Show POS only if logged in? Adjust as needed */
             <li><Link to="/pos" className="hover:underline">POS</Link></li>
          )}
          {showAdminLinks && (
             <> {/* Use fragment */}
                 <li><Link to="/history" className="hover:underline">History</Link></li>
                 <li><Link to="/dashboard" className="hover:underline">Dashboard</Link></li>
                 <li><Link to="/admin/products" className="hover:underline">Admin Products</Link></li>
             </>
          )}
           {/* Add Login/Logout Link conditionally */}
        </ul>
      </nav>

      <main className="p-4 md:p-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Protect POS route? Or allow anyone? */}
          <Route path="/pos" element={isAuthenticated ? <POSPage /> : <Navigate to="/" replace />} />

          {/* Protected Admin Routes */}
          <Route path="/history" element={<ProtectedAdminRoute><TransactionHistoryPage /></ProtectedAdminRoute>} />
          <Route path="/dashboard" element={<ProtectedAdminRoute><DashboardPage /></ProtectedAdminRoute>} />
          <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProductsPage /></ProtectedAdminRoute>} />
          <Route path="/" element={<HomePage />} />

          <Route path="/register" element={<RegisterPage />} />
          {/* Add Login Route if needed */}
          {/* <Route path="/login" element={<LoginPage />} /> */}

          {/* Add a 404 Not Found route */}
          <Route path="*" element={<div><h2>404 Not Found</h2></div>} />
        </Routes>
      </main>
    </div>
  );
}
export default App;