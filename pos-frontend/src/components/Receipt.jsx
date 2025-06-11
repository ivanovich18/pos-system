// src/components/Receipt.jsx
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

// Helper function for PHP currency formatting
const formatCurrency = (value) => {
    const numberValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return numberValue.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

// Make onClose optional for flexibility, although TransactionHistoryPage provides it
function Receipt({ receiptInfo, onClose = () => {} }) {
  const receiptRef = useRef(null);

  const handleSaveImage = () => { /* ... keep existing logic ... */ };

  if (!receiptInfo || !receiptInfo.transaction || !receiptInfo.transaction.items) {
      console.error("Receipt component missing data:", receiptInfo);
      return <div className="p-4 text-red-500">Error: Receipt data incomplete.</div>;
  }

  // Destructure, allowing tendered and change to be null/undefined
  const { transaction, tendered, change } = receiptInfo;

  const formattedDate = new Date(transaction.createdAt).toLocaleString('en-US', { /* ... */ });

  return (
    <div>
        <div ref={receiptRef} className="p-4 bg-white text-sm font-mono text-black">
            {/* Receipt Header */}
            <div className="text-center mb-4">
                {/* ... keep header content ... */}
                <p className="text-xs mt-1">Transaction ID: {transaction.id}</p>
            </div>

            {/* Item List */}
            <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
                {transaction.items.map((item) => (
                   /* ... keep item mapping logic ... */
                   <div key={item.id} className="flex justify-between mb-1 text-xs">
                     <div className="flex-grow pr-2">
                       <span className="block max-w-[150px] truncate">{item.quantity}x {item.product?.name || `ID ${item.productId}`}</span>
                       <span className="block text-gray-600">({item.product?.barcode || 'N/A'}) @ {formatCurrency(item.priceAtSale)}</span>
                     </div>
                     <span className="font-medium min-w-[60px] text-right">{formatCurrency(item.quantity * parseFloat(item.priceAtSale))}</span>
                   </div>
                ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 pt-2 text-xs">
                 {/* ... Optional Subtotal ... */}
                 <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
                     <span>TOTAL:</span>
                     <span>{formatCurrency(transaction.totalAmount)}</span>
                 </div>

                 {/* *** Conditionally Render Payment Details *** */}
                 {(tendered !== null && tendered !== undefined) && (
                    <div className="flex justify-between mt-2">
                        <span>Cash Tendered:</span>
                        <span>{formatCurrency(tendered)}</span>
                    </div>
                 )}
                 {(change !== null && change !== undefined) && (
                    <div className="flex justify-between">
                        <span>Change:</span>
                        <span>{formatCurrency(change)}</span>
                    </div>
                 )}
                 {/* *** End Conditional Render *** */}
            </div>

            {/* Footer Message */}
            <p className="text-center text-xs mt-4">Thank you!</p>
        </div>

         {/* Buttons */}
         <div className="p-4 bg-gray-50 border-t flex flex-col space-y-2 no-print">
            <button
            onClick={handleSaveImage}
            className="py-2 px-4 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 text-sm font-medium" // Check these classes
            >
            Save as Image
            </button>
            <button
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium" // Check these classes
            >
            Close Receipt
            </button>
        </div>
    </div>
  );
}

export default Receipt;