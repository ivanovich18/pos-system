// src/components/ProductForm.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect

// Accept new props: productToEdit, onFormSuccess, onCancelEdit
function ProductForm({ productToEdit, onFormSuccess, onCancelEdit }) {
  // State for each form field
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if we are in edit mode
  const isEditMode = Boolean(productToEdit);

  // --- Effect to populate form when productToEdit changes ---
  useEffect(() => {
    if (productToEdit) {
      // Populate form fields with data from the product being edited
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      // Prisma Decimal might come as string, ensure compatibility
      setPrice(productToEdit.price ? String(productToEdit.price) : '');
      setBarcode(productToEdit.barcode || '');
      setStock(productToEdit.stock !== undefined ? String(productToEdit.stock) : '');
      setError(null); // Clear errors when starting edit
      setSuccess(null); // Clear success message
    } else {
      // If not editing, clear the form (e.g., after submission or cancel)
      setName(''); setDescription(''); setPrice(''); setBarcode(''); setStock('');
    }
  }, [productToEdit]); // Re-run effect when productToEdit changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setIsSubmitting(true);

    if (!name || !price || !barcode) { /* Keep basic validation */ }

    // Prepare data, ensuring numbers are sent correctly
    const productData = {
        name,
        description: description || null,
        price: price, // Keep as string, backend expects/parses float/decimal
        barcode,
        // Only include stock if it's provided, otherwise backend default might apply on create
        ...(stock !== '' && { stock: stock })
    };

    // --- Determine API URL and Method ---
    const apiUrl = isEditMode ? `/api/products/${productToEdit.id}` : '/api/products';
    const apiMethod = isEditMode ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('authToken'); // <-- Get JWT
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // <-- Use JWT
    } else {
         // Handle case where token might be missing unexpectedly
         throw new Error('Authentication token not found. Please log in.');
    }

      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers: headers,
        body: JSON.stringify(productData),
      });

      const result = await response.json().catch(() => ({})); // Parse JSON, handle empty/invalid

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
             throw new Error(result.error || 'Authorization failed. Please log in again.');
             // Optionally trigger logout in parent here
         }
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Success!
      const successMessage = isEditMode ? `Product "${name}" updated successfully!` : `Product "${name}" added successfully!`;
      setSuccess(successMessage);

      // If NOT in edit mode, clear the form
      if (!isEditMode) {
          setName(''); setDescription(''); setPrice(''); setBarcode(''); setStock('');
      }

      // Call the success callback passed from the parent
      if (onFormSuccess) {
        onFormSuccess();
      }

    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'add'} product:`, err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      {/* Change title based on mode */}
      <h2 className="text-xl font-semibold mb-4">{isEditMode ? `Edit Product (ID: ${productToEdit.id})` : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        {/* Form fields (keep existing structure) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
            <div><label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">Barcode *</label><input type="text" id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
            <div><label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price *</label><input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
            <div><label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label><input type="number" id="stock" value={stock} onChange={(e) => setStock(e.target.value)} min="0" step="1" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
        </div>
        <div className="mb-4"><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea></div>

        {/* Submit/Cancel Buttons */}
        <div className="flex justify-end space-x-3">
           {/* Show Cancel button only in edit mode */}
           {isEditMode && (
              <button
                 type="button" // Important: type="button" to prevent form submission
                 onClick={onCancelEdit} // Call prop passed from parent
                 className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                 Cancel Edit
              </button>
           )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isEditMode ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </form>
    </div>
  );
}
export default ProductForm;