// src/components/ProductList.jsx
import React, { useState, useEffect, useCallback } from 'react';

// Assume formatCurrencyPHP is available or defined here/imported
const formatCurrencyPHP = (value) => {/* ... */};

// Accept new props for handling clicks
function ProductList({ refreshKey, onEditClick, onDeleteClick, userRole }) { // Added refreshKey, onEditClick, onDeleteClick
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Inside ProductList component
  const requestSort = useCallback((key) => {
    let direction = 'asc';
    // If clicking the same key, toggle direction
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    // Always set key, set direction (either new asc or toggled desc)
    setSortConfig({ key, direction });
    console.log(`Requesting sort by: ${key}, direction: ${direction}`);
  }, [sortConfig]); // Depend on current sortConfig

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); setError(null);
      try {
        // Build query parameters including sorting
        const params = new URLSearchParams();
        if (sortConfig.key) {
            params.append('sortBy', sortConfig.key);
            params.append('sortOrder', sortConfig.direction);
        }
        // Add other filters like stockLevel later if needed here

        const response = await fetch(`/api/products?${params.toString()}`); // Append params
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProducts(data);
      } catch (err) { console.error("Failed to fetch products:", err); setError(err.message); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [refreshKey, sortConfig]); // Re-fetch when refreshKey changes

  // --- Render Logic ---
  if (loading) return <div className="text-center p-4">Loading products...</div>;
  if (error) return <div className="text-center p-4 text-red-600">Error fetching products: {error}</div>;

  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-3 px-2">Product List</h2>
      {products.length === 0 ? ( <p className="px-2 text-gray-500">No products found.</p> ) : (
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {/* Example for ID column */}
              <th scope="col" className="py-3 px-6">
                  {/* Wrap header text in a button for click handling */}
                  <button onClick={() => requestSort('id')} className="flex items-center hover:text-gray-900">
                      ID
                      {/* Show sort indicator */}
                      {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : null}
                  </button>
              </th>
              {/* Example for Name column */}
              <th scope="col" className="py-3 px-6">
                  <button onClick={() => requestSort('name')} className="flex items-center hover:text-gray-900">
                      Name
                      {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : null}
                  </button>
              </th>
              {/* Example for Barcode column */}
              <th scope="col" className="py-3 px-6">
                  <button onClick={() => requestSort('barcode')} className="flex items-center hover:text-gray-900">
                      Barcode
                      {sortConfig.key === 'barcode' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : null}
                  </button>
              </th>
              {/* Example for Price column */}
              <th scope="col" className="py-3 px-6">
                  <button onClick={() => requestSort('price')} className="flex items-center hover:text-gray-900">
                      Price
                      {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : null}
                  </button>
              </th>
              {/* Example for Stock column */}
              <th scope="col" className="py-3 px-6">
                  <button onClick={() => requestSort('stock')} className="flex items-center hover:text-gray-900">
                      Stock
                      {sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : null}
                  </button>
              </th>
              <th scope="col" className="py-3 px-6">Actions</th> {/* Actions usually not sortable */}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                <td className="py-4 px-6 font-medium">{product.id}</td>
                <td className="py-4 px-6">{product.name}</td>
                <td className="py-4 px-6">{product.barcode}</td>
                <td className="py-4 px-6">{formatCurrencyPHP(product.price)}</td>
                <td className="py-4 px-6">{product.stock}</td>
                {/* <td className="py-4 px-6 max-w-xs truncate">{product.description || '-'}</td> */}
                {/* --- Add Actions Cell --- */}
                <td className="py-4 px-6 flex space-x-2">
                  <button
                    onClick={() => onEditClick(product)} // Pass the whole product object
                    className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteClick(product.id)} // Pass only the ID
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                    title="Delete"
                  >
                    Delete
                  </button>
                </td>
                {/* --- End Actions Cell --- */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductList;