// src/pages/AdminProductsPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import LoginForm from '../components/LoginForm';

// const CORRECT_ADMIN_TOKEN = 'SUPER_SECRET_ADMIN_TOKEN_123'; // Keep this consistent

function AdminProductsPage() {
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger list refresh
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // <-- State for product being edited
  const [pageError, setPageError] = useState(''); // State for page-level errors (like delete failure)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Add loading state for auth check

  useEffect(() => {
    console.log('Checking auth status on mount...'); // Add log
    setIsLoadingAuth(true); // Start loading check
    const token = localStorage.getItem('authToken'); // Get the JWT from local storage
    if (token) {
      // If a token simply *exists*, assume logged in for initial UI state.
      // Actual token validity is checked by the backend on API calls.
      console.log('Auth token found in localStorage.');
      setIsAdminLoggedIn(true);
    } else {
      // If no token, ensure logged out state.
      console.log('No auth token found in localStorage.');
      setIsAdminLoggedIn(false);
    }
    setIsLoadingAuth(false); // Finished check
  }, []); // Run only on mount


  // Function to trigger list refresh
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Function passed down to ProductForm for when add/update is successful
  const handleFormSuccess = useCallback(() => {
    setEditingProduct(null); // Clear editing state after successful update/add
    triggerRefresh(); // Refresh the list
  }, [triggerRefresh]);

  // Function passed down to ProductList for Edit button
  const handleEditClick = useCallback((product) => {
    console.log("Editing product:", product);
    setEditingProduct(product); // Set the product to populate the form
    setPageError(''); // Clear previous page errors
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top where form likely is
  }, []);

  // Function passed down to ProductList for Delete button
  const handleDeleteClick = useCallback(async (productId) => {
    setPageError(''); // Clear previous errors
    if (!window.confirm(`Are you sure you want to delete product ID ${productId}?`)) {
      return; // Stop if user cancels
    }

    const token = localStorage.getItem('authToken'); // <-- Get JWT
if (!token) {
    setPageError("Authentication error. Please log in again.");
    setIsAdminLoggedIn(false); return;
}
try {
    const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`, // <-- Use JWT
        }
    });

      if (response.status === 204) {
        // Successful deletion
        alert(`Product ID ${productId} deleted successfully.`);
        triggerRefresh(); // Refresh the list
      } else if (response.status === 401 || response.status === 403) {
         setPageError("Authorization failed. Please log in again.");
         setIsAdminLoggedIn(false); // Force re-login
      } else {
        // Handle other errors (e.g., 404 Not Found, 500 Server Error)
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete product. Status: ${response.status}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setPageError(`Delete failed: ${err.message}`);
    }
  }, [triggerRefresh]); // Include triggerRefresh dependency

  // Function for logging out remains the same...
  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setPageError(''); // Clear any previous login errors
  };
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // <-- Remove the JWT
    setIsAdminLoggedIn(false);
    setEditingProduct(null); // Also clear editing state on logout
    setPageError('');
  };

  // --- Render Logic ---
  if (isLoadingAuth) {
    return <div className="p-4 text-center">Checking authentication...</div>; // Show loading during initial check
 }

  // --- Conditional Render Logic ---
  if (!isAdminLoggedIn) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
       <div className="flex justify-between items-center mb-4">
         <h1 className="text-2xl font-semibold">Admin - Manage Products</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
          >
            Logout
          </button>
       </div>

        {/* Display page-level errors */}
        {pageError && <p className="text-red-600 bg-red-100 p-3 rounded mb-4">{pageError}</p>}

       {/* Pass editingProduct and success handler to form */}
       <ProductForm
          key={editingProduct ? editingProduct.id : 'new'} // Change key to force re-render on edit
          productToEdit={editingProduct}
          onFormSuccess={handleFormSuccess}
          onCancelEdit={() => setEditingProduct(null)} // Pass cancel handler
       />

       {/* Pass refresh key and click handlers to list */}
       <ProductList
          refreshKey={refreshKey}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
       />
    </div>
  );
}
export default AdminProductsPage;