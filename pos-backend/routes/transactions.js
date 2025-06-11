// pos-backend/routes/transactions.js
import express from 'express';
import prisma from '../db.js';
import verifyAdmin from '../middleware/verifyAdmin.js'; // Import your middleware for admin verification
import { Prisma } from '@prisma/client'; // Keep for types if needed

const router = express.Router();

// Allowed sortable fields for transactions
const allowedTxSortFields = {
  id: 'id',
  date: 'createdAt', // Map 'date' param to 'createdAt' field
  total: 'totalAmount' // Map 'total' param to 'totalAmount' field
};

router.post('/', async (req, res) => {
  const { cart, totalAmount } = req.body;

  // Basic validation
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty cart provided' });
  }
  const parsedTotalAmount = parseFloat(totalAmount);
  if (isNaN(parsedTotalAmount) || parsedTotalAmount < 0) { // Added check for negative total
    return res.status(400).json({ error: 'Invalid totalAmount provided' });
  }

  try {
    // --- Start Prisma Transaction ---
    // The transaction ensures all operations succeed or fail together
    const createdTransactionId = await prisma.$transaction(async (tx) => {
      // Array to hold data for TransactionItem creation
      const transactionItemsData = [];
      let calculatedTotal = new Prisma.Decimal(0); // Use Prisma Decimal for calculation

      // 1. Process cart items, check stock, prepare item data
      for (const item of cart) {
        const productId = parseInt(item.productId, 10);
        const quantity = parseInt(item.quantity, 10);

        if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid data for item: productId=${item.productId}, quantity=${item.quantity}`);
        }

        // Find product *within transaction*
        // Selecting fields needed prevents over-fetching and provides data for receipt
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true, name: true, stock: true, price: true, barcode: true } // Get name, price, barcode too
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found.`);
        }
        if (product.stock < quantity) {
          throw new Error(`Insufficient stock for ${product.name} (ID: ${productId}). Available: ${product.stock}, Requested: ${quantity}`);
        }

        // Decrement stock
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        });

        // Add item details to array for bulk creation later
        transactionItemsData.push({
          productId: productId,
          quantity: quantity,
          priceAtSale: product.price // Store the price from the Product table at this moment
        });

        // Calculate total within backend for verification (optional but good)
        calculatedTotal = calculatedTotal.plus(product.price.times(quantity));

      } // End cart loop

      // Optional: Verify backend calculated total matches frontend total
      if (calculatedTotal.comparedTo(parsedTotalAmount) !== 0) {
          console.warn(`Total mismatch: Frontend=${parsedTotalAmount}, Backend=${calculatedTotal.toFixed(2)}`);
          // Decide whether to throw error or proceed
          // throw new Error(`Total amount mismatch. Please recalculate cart.`);
      }

      // 2. Create the main Transaction record
      const createdTransaction = await tx.transaction.create({
        data: {
          totalAmount: parsedTotalAmount, // Use amount from frontend (or backend calculation)
        },
      });

      // 3. Create the related TransactionItem records using prepared data
      await tx.transactionItem.createMany({
        data: transactionItemsData.map(item => ({
          ...item,
          transactionId: createdTransaction.id, // Link to the transaction just created
        }))
      });

      // 4. Return the ID of the created transaction from the $transaction block
      return createdTransaction.id;

    }); // --- End Prisma Transaction ---

    // 5. Re-fetch the transaction WITH its items details to return to frontend
    const completeTransaction = await prisma.transaction.findUnique({
        where: { id: createdTransactionId },
        include: {
            items: { // Include the related transaction items
                include: {
                    product: { // For each item, include product name/barcode
                        select: { name: true, barcode: true }
                    }
                }
            }
        }
    });

    // 6. Send successful response with complete transaction data
    res.status(201).json({ message: 'Transaction successful', transaction: completeTransaction });

  } catch (error) {
    // Handle errors
    console.error("Transaction failed:", error);
    res.status(500).json({
        error: 'Transaction failed',
        details: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/transactions - Modified for Sorting
router.get('/', verifyAdmin, async (req, res) => { // Added verifyAdmin protection
  const { sortBy, sortOrder } = req.query;

  try {
      // --- Handle Sorting ---
      const sortKey = allowedTxSortFields[sortBy] || 'createdAt'; // Default sort by date
      const order = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc'; // Default to desc for date
      const orderByClause = { [sortKey]: order };
      console.log(`Sorting transactions by: ${sortKey} ${order}`); // Log sorting

      const transactions = await prisma.transaction.findMany({
          orderBy: orderByClause, // Apply dynamic sorting
          include: {
              items: {
                  include: {
                      product: { select: { name: true, barcode: true } } // Keep includes
                  }
              }
          },
          // Add pagination later if needed
      });
      res.status(200).json(transactions);
  } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({ error: 'Could not fetch transaction history', details: error.message });
  }
});

export default router;