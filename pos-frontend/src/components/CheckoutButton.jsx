// src/components/CheckoutButton.jsx
import React, { useState, useMemo } from 'react';

function CheckoutButton({ cart, onCheckoutSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Calculate total price locally for display on button
  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.product.price) || 0;
      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  // Helper for PHP currency formatting (can be moved to a util file later)
  const formatCurrencyPHP = (value) => {
      const numberValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      return numberValue.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    // Prepare cart data for the backend API format
    const cartData = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cartData,
          totalAmount: totalPrice.toFixed(2) // Send total calculated here
        }),
      });

      const result = await response.json(); // Always parse JSON

      if (!response.ok) {
        // Use details from backend error if available
        throw new Error(result.details || result.error || `HTTP error! Status: ${response.status}`);
      }

      // If successful, call the callback with the transaction data from the response
      // Ensure the backend sends back the created transaction in result.transaction
      if (result.transaction) {
           onCheckoutSuccess(result.transaction);
      } else {
          // Handle case where backend response format is unexpected
           console.error("Checkout succeeded but response did not contain transaction data:", result);
           throw new Error("Checkout succeeded but couldn't get receipt data.");
      }


    } catch (err) {
      console.error("Checkout failed:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-2">Error: {error}</p>}
      <button
        onClick={handleCheckout}
        disabled={cart.length === 0 || isSubmitting}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${ (cart.length === 0 || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? 'Processing...' : `Finalize Sale (${formatCurrencyPHP(totalPrice)})`}
      </button>
    </div>
  );
}

export default CheckoutButton;