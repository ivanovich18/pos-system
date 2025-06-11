// src/components/CartDisplay.jsx (Corrected)
import React, { useMemo } from 'react';

function CartDisplay({ cart, onRemoveItem, onUpdateQuantity }) {

  // Add this line: Default to empty array if cart prop is null, undefined, or not an array
  const safeCart = Array.isArray(cart) ? cart : [];

  // Calculate total price using useMemo for optimization
  const totalPrice = useMemo(() => {
    // Use safeCart here instead of cart
    return safeCart.reduce((total, item) => {
      const price = parseFloat(item.product.price) || 0;
      return total + price * item.quantity;
    }, 0);
  // Depend on safeCart now
  }, [safeCart]);

  // Change the check here too
  if (safeCart.length === 0) {
    return <p className="text-gray-500 italic">Cart is empty.</p>;
  }

  return (
    <div className="border rounded-md mb-4">
      <ul className="divide-y divide-gray-200"> {/* Added divider */}
        {/* Change this map to use safeCart */}
        {safeCart.map(item => (
          <li key={item.product.id} className="flex justify-between items-center p-3">
            {/* Item Details */}
            <div className="flex-grow mr-2 overflow-hidden"> {/* Added overflow-hidden */}
              <span className="font-medium block truncate">{item.product.name}</span> {/* Added truncate */}
              <span className="text-xs text-gray-500 block">${parseFloat(item.product.price).toFixed(2)} each</span>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0"> {/* Adjusted spacing */}
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                className="px-2 py-0.5 border rounded text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" // Added focus style
                aria-label={`Decrease quantity of ${item.product.name}`}
              >
                -
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span> {/* Adjusted width/size */}
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                className="px-2 py-0.5 border rounded text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" // Added focus style
                aria-label={`Increase quantity of ${item.product.name}`}
              >
                +
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemoveItem(item.product.id)}
              className="ml-2 sm:ml-3 text-red-500 hover:text-red-700 text-xs flex-shrink-0" // Adjusted margin
              aria-label={`Remove ${item.product.name} from cart`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* Total Price */}
      <div className="p-3 bg-gray-50 border-t">
        <span className="font-semibold">Total:</span>
        <span className="float-right font-bold">${totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default CartDisplay;