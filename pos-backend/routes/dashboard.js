// pos-backend/routes/dashboard.js
import express from 'express';
import prisma from '../db.js';
// Optional: Add auth middleware if dashboard data should be protected
// import checkAdminToken from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/dashboard/bestsellers - Get top selling products by quantity
router.get('/bestsellers', /* optional: checkAdminToken, */ async (req, res) => {
  try {
    // Define how many top sellers to return (e.g., top 10)
    const limit = parseInt(req.query.limit, 10) || 10;

    const bestsellers = await prisma.transactionItem.groupBy({
      by: ['productId'], // Group by product
      _sum: {
        quantity: true, // Sum the quantity sold for each product
      },
      orderBy: {
        _sum: {
          quantity: 'desc', // Order by the summed quantity descending
        },
      },
      take: limit, // Limit the results
    });

    // Get product names for the IDs found
    const productIds = bestsellers.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Map product names back to the bestseller results
    const results = bestsellers.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: product ? product.name : 'Unknown Product',
        totalQuantitySold: item._sum.quantity,
      };
    });

    res.status(200).json(results);

  } catch (error) {
    console.error("Error fetching bestsellers:", error);
    res.status(500).json({ error: 'Could not fetch bestsellers', details: error.message });
  }
});

// Add other dashboard routes here later (e.g., sales stats)

export default router;