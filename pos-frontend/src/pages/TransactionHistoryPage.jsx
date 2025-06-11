// src/pages/TransactionHistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal'; // Using react-modal for overlay effect
import Receipt from '../components/Receipt'; // Import Receipt component
import { useAuth } from '../context/AuthContext'; // Import Auth context for user role

// Helper function for PHP currency formatting (or import from utils)
const formatCurrencyPHP = (value) => {
    const numberValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return numberValue.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

// Optional: Set App Element for Modal accessibility if not done globally
// Make sure to do this once in your app's entry point (e.g., main.jsx)
// import Modal from 'react-modal';
// Modal.setAppElement('#root');

function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth(); // Get token from Auth context

  // --- State for Sorting ---
  // key: maps to allowedTxSortFields keys ('id', 'date', 'total')
  // direction: 'asc' or 'desc'
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // Default sort by date descending

  // --- State for Receipt Modal ---
  const [selectedReceiptInfo, setSelectedReceiptInfo] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // --- Fetch history data ---
  // Re-fetches when sortConfig changes
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query parameters including sorting
        const params = new URLSearchParams();
        if (sortConfig.key) {
            params.append('sortBy', sortConfig.key); // Use 'id', 'date', or 'total'
            params.append('sortOrder', sortConfig.direction);
        }

        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) {
          // Try to parse error from backend
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error("Failed to fetch transaction history:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [sortConfig, token]); // Re-fetch when sortConfig changes

  // --- Function to handle sort requests ---
  const requestSort = useCallback((key) => {
      let direction = 'asc';
      // If clicking the same key, toggle direction
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
          direction = 'asc'; // Toggle back to asc
      }
      // If clicking a new key, default direction is 'asc' (unless it's date?)
      // Let's make default 'asc' for simplicity, except maybe for date default
      if (key !== sortConfig.key && key === 'date') {
          direction = 'desc'; // Default date sort to descending
      }

      setSortConfig({ key, direction });
      console.log(`Requesting sort by: ${key}, direction: ${direction}`);
  }, [sortConfig]); // Depend on current sortConfig

  // --- Functions for Receipt Modal ---
  const handleViewReceipt = useCallback((transaction) => {
    setSelectedReceiptInfo({
      transaction: transaction,
      tendered: null, // History doesn't have this info
      change: null
    });
    setIsReceiptModalOpen(true);
  }, []);

  const handleCloseReceipt = useCallback(() => {
    setIsReceiptModalOpen(false);
    setSelectedReceiptInfo(null);
  }, []);

  // --- Function to render sort indicators ---
  const getSortIndicator = (key) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // --- Render Logic ---
  if (loading) return <p className="p-4 text-center">Loading history...</p>;
  if (error) return <p className="text-red-600 p-4 text-center">Error loading history: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Transaction History</h1>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white"> {/* Added bg-white */}
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100"> {/* Changed bg */}
            <tr>
              {/* Make headers clickable buttons */}
              <th scope="col" className="py-3 px-6">
                <button onClick={() => requestSort('id')} className="flex items-center hover:text-gray-900">
                    ID{getSortIndicator('id')}
                </button>
              </th>
              <th scope="col" className="py-3 px-6">
                 <button onClick={() => requestSort('date')} className="flex items-center hover:text-gray-900">
                     Date & Time{getSortIndicator('date')}
                 </button>
              </th>
              <th scope="col" className="py-3 px-6">Items</th> {/* Items not sortable via API easily */}
              <th scope="col" className="py-3 px-6">
                 <button onClick={() => requestSort('total')} className="flex items-center hover:text-gray-900">
                     Total Amount{getSortIndicator('total')}
                 </button>
              </th>
              <th scope="col" className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 italic text-gray-400">No transactions found.</td></tr>
            ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{tx.id}</td>
                    <td className="py-4 px-6 whitespace-nowrap">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="py-4 px-6">
                       <ul className="list-disc list-inside text-xs space-y-1">
                          {tx.items?.map(item => ( // Added optional chaining
                              <li key={item.id} className="truncate max-w-xs"> {/* Prevent extremely long lists */}
                                  {item.quantity}x {item.product?.name || `(ID: ${item.productId})`}
                              </li>
                          )) || <li>(No item data)</li>}
                       </ul>
                    </td>
                    <td className="py-4 px-6 font-semibold whitespace-nowrap">{formatCurrencyPHP(tx.totalAmount)}</td>
                    <td className="py-4 px-6">
                       <button
                          onClick={() => handleViewReceipt(tx)}
                          className="font-medium text-blue-600 hover:underline text-xs px-2 py-1 border border-blue-500 rounded hover:bg-blue-50"
                       >
                          View Receipt
                       </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      <Modal
         isOpen={isReceiptModalOpen}
         onRequestClose={handleCloseReceipt}
         contentLabel="Transaction Receipt"
         className="modal-content" // Use CSS classes from index.css
         overlayClassName="modal-overlay" // Use CSS classes from index.css
         shouldCloseOnOverlayClick={true}
       >
        {selectedReceiptInfo && (
           <Receipt
              receiptInfo={selectedReceiptInfo}
              onClose={handleCloseReceipt}
           />
        )}
       </Modal>
    </div>
  );
}

export default TransactionHistoryPage;