// src/pages/POSPage.jsx
import React, { useState, useCallback } from 'react';
import Modal from 'react-modal'; // Using react-modal for overlay effect
import ProductSearch from '../components/ProductSearch';
import CartDisplay from '../components/CartDisplay';
import CheckoutButton from '../components/CheckoutButton';
import Receipt from '../components/Receipt';

// Set App Element for Modal accessibility (do this once, e.g., in main.jsx or App.jsx)
// If using Vite's default HTML:
// Modal.setAppElement('#root');

function POSPage() {
  const [cart, setCart] = useState([]);
  // State for the receipt flow
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [showTenderedInput, setShowTenderedInput] = useState(false);
  const [cashTendered, setCashTendered] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // --- Cart Functions ---
  const addToCart = useCallback((productToAdd) => {
    setCart((prevCart) => {
     const existingItemIndex = prevCart.findIndex((item) => item.product.id === productToAdd.id);
     if (productToAdd.stock <= 0 && existingItemIndex === -1) { alert(`${productToAdd.name} is out of stock!`); return prevCart; }
     if (existingItemIndex > -1) {
        const currentItem = prevCart[existingItemIndex];
        if (currentItem.quantity >= productToAdd.stock) { alert(`No more stock available for ${productToAdd.name}`); return prevCart; }
       const updatedCart = [...prevCart];
       updatedCart[existingItemIndex] = { ...currentItem, quantity: currentItem.quantity + 1, };
       return updatedCart;
     } else { return [...prevCart, { product: productToAdd, quantity: 1 }]; }
   });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    setCart((prevCart) => {
       const itemIndex = prevCart.findIndex(item => item.product.id === productId);
       if (itemIndex === -1) return prevCart;
       const productInCart = prevCart[itemIndex].product;
       if (newQuantity <= 0) { return prevCart.filter((item) => item.product.id !== productId); }
       else if (newQuantity > productInCart.stock) { alert(`Only ${productInCart.stock} items available for ${productInCart.name}`); return prevCart; }
       else { return prevCart.map((item, index) => index === itemIndex ? { ...item, quantity: newQuantity } : item ); }
     });
   }, []);

  const clearCart = useCallback(() => { setCart([]); }, []);

  // --- Checkout and Receipt Flow Functions ---
  const handleCheckoutSuccess = useCallback((completedTransaction) => {
    console.log("Checkout Success, Transaction Data:", completedTransaction);
    setPendingTransaction(completedTransaction);
    setShowTenderedInput(true); // Show cash input next
    setCashTendered(''); // Clear previous input
  }, [clearCart]);

  const handleShowReceipt = useCallback(() => {
    if (!pendingTransaction) return;
    const tendered = parseFloat(cashTendered);
    const total = parseFloat(pendingTransaction.totalAmount);
    if (isNaN(tendered) || tendered < total) {
      alert(`Cash tendered (₱${cashTendered || '0.00'}) must be a number and at least the total amount (${formatCurrencyPHP(total)})`);
      return;
    }
    const change = tendered - total;
    setReceiptData({ transaction: pendingTransaction, tendered: tendered, change: change });
    clearCart();
    setShowTenderedInput(false);
    setShowReceiptModal(true);
    setPendingTransaction(null);
  }, [cashTendered, pendingTransaction]);

  // Helper for local display if needed elsewhere
  const formatCurrencyPHP = (value) => {
      const numberValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      return numberValue.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
  };


  // --- JSX Render ---
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Point of Sale</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Product Selection */}
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-xl mb-3 font-medium">Select Products</h2>
          {/* Add Scan Button if desired */}
          {/* <button onClick={() => alert('Scanner not fully implemented yet!')} className="...">Scan Barcode</button> */}
          <ProductSearch onProductSelect={addToCart} />
        </div>

        {/* Column 2: Cart & Checkout/Tendered Input */}
        <div className="md:col-span-1 bg-white p-4 rounded shadow flex flex-col" style={{ minHeight: '400px' }}>
           <h2 className="text-xl mb-3 font-medium">Current Sale</h2>
           <div className="flex-grow mb-4 overflow-y-auto border rounded p-2">
              <CartDisplay
                cart={cart}
                onRemoveItem={removeFromCart}
                onUpdateQuantity={updateQuantity}
              />
           </div>

           {/* Show Tendered Input OR Checkout Button */}
           {showTenderedInput ? (
             <div className="mt-auto border-t pt-4">
               <h3 className="text-lg font-semibold mb-2">Enter Cash Tendered</h3>
               <p className="text-sm mb-2">Total Amount: {formatCurrencyPHP(pendingTransaction?.totalAmount || 0)}</p>
               <label htmlFor="cash-tendered" className="block text-sm font-medium text-gray-700 mb-1">Cash Tendered (₱)</label>
               <input
                 type="number"
                 id="cash-tendered"
                 value={cashTendered}
                 onChange={(e) => setCashTendered(e.target.value)}
                 min={pendingTransaction ? parseFloat(pendingTransaction.totalAmount).toFixed(2) : "0"}
                 step="0.01"
                 placeholder="Enter cash amount"
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-2"
               />
               <button
                 onClick={handleShowReceipt}
                 className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
               >
                 Confirm Payment & Show Receipt
               </button>
               <button
                 onClick={() => { setShowTenderedInput(false); setPendingTransaction(null); }} // Option to cancel
                 className="w-full mt-2 py-1 px-2 text-xs text-gray-600 hover:underline"
               >
                 Cancel Payment
               </button>
             </div>
           ) : (
             <div className="mt-auto">
               <CheckoutButton
                 cart={cart}
                 onCheckoutSuccess={handleCheckoutSuccess}
               />
             </div>
           )}
         </div>
      </div>

                {/* Receipt Modal using react-modal */}
                <Modal
             isOpen={showReceiptModal}
             // Combine state updates into the function passed to onRequestClose
             onRequestClose={() => {
                 setShowReceiptModal(false);
                 setReceiptData(null); // Clear receipt data when modal requests close (e.g., clicking overlay)
             }}
             contentLabel="Transaction Receipt"
             className="modal-content" // Use CSS classes
             overlayClassName="modal-overlay" // Use CSS classes
             shouldCloseOnOverlayClick={true} // Allow closing by clicking outside
           >
            {/* Render Receipt only when data is ready */}
            {receiptData && (
               <Receipt
                  receiptInfo={receiptData}
                  // Combine state updates into the function passed to onClose prop of Receipt
                  onClose={() => {
                      setShowReceiptModal(false);
                      setReceiptData(null); // Clear receipt data when Receipt's close button is clicked
                  }}
               />
            )}
           </Modal>
        </div> // This closing div matches the outer div in the return statement
      ); // This closing parenthesis matches the return statement
    } // This closing brace matches the function POSPage()
    export default POSPage; // Keep the export