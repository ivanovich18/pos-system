// src/pages/HomePage.jsx
import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
// Optional: Import icons later if you want to add them
// import { ShoppingCartIcon, ClockIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline'; // Example using heroicons (npm install @heroicons/react)

function HomePage() {
  // --- Optional: Check Login Status ---
  // You might want to fetch or check login status here later
  // to conditionally show links (e.g., hide Admin if not logged in)
  // const isLoggedIn = localStorage.getItem('authToken'); // Simple check
  const [lowStockCount, setLowStockCount] = useState(0); // Example state for low stock count
  const [isLoadingStats, setIsLoadingStats] = useState(true); // Loading state for stats
  const LOW_STOCK_THRESHOLD = 5; // Example threshold for low stock

  useEffect(() => {
    const fetchLowStock = async () => {
      setIsLoadingStats(true);
      try {
        // Fetch only low stock items
        const response = await fetch(`/api/products?stockLevel=low&threshold=${LOW_STOCK_THRESHOLD}`);
        if (!response.ok) throw new Error('Failed to fetch low stock count');
        const data = await response.json();
        setLowStockCount(data.length); // Just get the count
      } catch (error) {
        console.error("Error fetching stats for homepage:", error);
        // Don't necessarily show error on homepage, just fail gracefully
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchLowStock();
  }, []); // Fetch on mount

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Welcome to Your POS System</h1>
      <p className="text-gray-600 mb-8">Select an action to get started.</p>

      {/* Mini-Stats Section (Example) */}
      {!isLoadingStats && lowStockCount > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
          <p>
            <span className="font-bold">Alert:</span> You have{' '}
            <Link to="/dashboard" className="font-bold underline hover:text-yellow-900">
                {lowStockCount} item(s) low on stock
            </Link>
            {' '}({LOW_STOCK_THRESHOLD} or less).
          </p>
        </div>
      )}

      {/* Grid layout for navigation cards/buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        {/* POS Link Card */}
        <Link
          to="/pos"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center border border-gray-200 hover:border-gray-300"
        >
          {/* Optional Icon */}
          {/* <ShoppingCartIcon className="h-12 w-12 mx-auto text-blue-500 mb-2" /> */}
          <h2 className="font-semibold text-lg text-blue-600">New Sale</h2>
          <p className="text-sm text-gray-500 mt-1">Start a new transaction</p>
        </Link>

        {/* History Link Card */}
        <Link
          to="/history"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center border border-gray-200 hover:border-gray-300"
        >
          {/* <ClockIcon className="h-12 w-12 mx-auto text-green-500 mb-2" /> */}
          <h2 className="font-semibold text-lg text-green-600">History</h2>
          <p className="text-sm text-gray-500 mt-1">View past transactions</p>
        </Link>

        {/* Dashboard Link Card */}
        <Link
          to="/dashboard"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center border border-gray-200 hover:border-gray-300"
        >
          {/* <ChartBarIcon className="h-12 w-12 mx-auto text-purple-500 mb-2" /> */}
          <h2 className="font-semibold text-lg text-purple-600">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">View sales & stock insights</p>
        </Link>

        {/* Admin Products Link Card (Conditionally show if needed) */}
        {/* {isLoggedIn && ( // Example condition */}
          <Link
            to="/admin/products"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center border border-gray-200 hover:border-gray-300"
          >
            {/* <CogIcon className="h-12 w-12 mx-auto text-gray-500 mb-2" /> */}
            <h2 className="font-semibold text-lg text-gray-600">Manage Products</h2>
            <p className="text-sm text-gray-500 mt-1">Add, edit, or delete items</p>
          </Link>
        {/* )} */}

      </div>
    </div>
  );
}

export default HomePage;