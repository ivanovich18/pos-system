// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';

// Helper function for PHP currency formatting (or import from utils)
const formatCurrencyPHP = (value) => { /* ... same as above ... */ };

function DashboardPage() {
  // State for different dashboard sections
  const [bestsellers, setBestsellers] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Define low stock threshold (could be state or prop later)
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch data concurrently
        const [bsRes, oosRes, lsRes] = await Promise.all([
          fetch('/api/dashboard/bestsellers?limit=5'), // Top 5 bestsellers
          fetch('/api/products?stockLevel=zero'),      // Out of stock
          fetch(`/api/products?stockLevel=low&threshold=${LOW_STOCK_THRESHOLD}`) // Low stock
        ]);

        // Check all responses
        if (!bsRes.ok) throw new Error(`Bestsellers fetch failed: ${bsRes.status}`);
        if (!oosRes.ok) throw new Error(`Out of Stock fetch failed: ${oosRes.status}`);
        if (!lsRes.ok) throw new Error(`Low Stock fetch failed: ${lsRes.status}`);

        // Parse JSON data
        const bsData = await bsRes.json();
        const oosData = await oosRes.json();
        const lsData = await lsRes.json();

        // Update state
        setBestsellers(bsData);
        setOutOfStock(oosData);
        setLowStock(lsData);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []); // Fetch data on mount

  if (loading) return <p>Loading dashboard data...</p>;
  if (error) return <p className="text-red-600">Error loading dashboard: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Bestsellers Card */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Top 5 Bestsellers (by Quantity)</h2>
          {bestsellers.length > 0 ? (
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {bestsellers.map(item => (
                  <li key={item.productId}>
                    {item.name} ({item.totalQuantitySold} sold)
                  </li>
                ))}
              </ol>
          ) : <p className="text-sm text-gray-500">No sales data yet.</p>}
        </div>

         {/* Out of Stock Card */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Out of Stock ({outOfStock.length})</h2>
           {outOfStock.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                {outOfStock.map(item => ( <li key={item.id}>{item.name}</li> ))}
              </ul>
          ) : <p className="text-sm text-gray-500">No items out of stock.</p>}
        </div>

         {/* Low Stock Card */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Low Stock ({lowStock.length})</h2>
          <p className="text-sm text-gray-500 mb-2">Items with less than {LOW_STOCK_THRESHOLD} in stock:</p>
           {lowStock.length > 0 ? (
               <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                {lowStock.map(item => ( <li key={item.id}>{item.name} ({item.stock} left)</li> ))}
              </ul>
          ) : <p className="text-sm text-gray-500">No items currently low on stock.</p>}
        </div>

         {/* Add more cards here later for total sales, inventory value etc. */}

      </div>
    </div>
  );
}

export default DashboardPage;