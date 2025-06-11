import React, { useState, useEffect, useMemo } from 'react';

function ProductSearch({ onProductSelect }) {
  const [allProducts, setAllProducts] = useState([]); // Holds all fetched products
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products on component mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setAllProducts(data);
      } catch (err) {
        console.error("Failed to fetch products for search:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []); // Empty dependency array, runs once

  // Filter products based on search term (case-insensitive)
  // useMemo prevents re-filtering on every render unless dependencies change
  const filteredResults = useMemo(() => {
    if (!searchTerm) {
      return []; // Don't show results if search is empty
      // Alternatively: return allProducts; // Show all if search is empty
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(lowerSearchTerm) ||
      product.barcode.includes(lowerSearchTerm) // Also search barcode
    );
  }, [searchTerm, allProducts]);

  const handleSelect = (product) => {
    onProductSelect(product); // Call the function passed from POSPage (addToCart)
    setSearchTerm(''); // Clear search after selection
  };

  // --- Render Logic ---
  if (loading) return <p className="text-gray-500">Loading products...</p>;
  if (error) return <p className="text-red-600">Error loading products: {error}</p>;

  return (
    <div>
      <input
        type="search"
        placeholder="Search by name or barcode..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-3"
      />

      {/* Display Results (only if search term is not empty) */}
      {searchTerm && (
        <ul className="max-h-60 overflow-y-auto border rounded-md">
          {filteredResults.length > 0 ? (
            filteredResults.map(product => (
              <li
                key={product.id}
                onClick={() => handleSelect(product)}
                className="p-3 hover:bg-indigo-100 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
              >
                <span>{product.name} ({product.barcode})</span>
                <span className="text-sm text-gray-600">${parseFloat(product.price).toFixed(2)}</span>
              </li>
            ))
          ) : (
            <li className="p-3 text-gray-500">No products found matching "{searchTerm}".</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default ProductSearch;