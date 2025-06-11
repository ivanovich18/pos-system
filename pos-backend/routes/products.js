// pos-backend/routes/products.js
import express from 'express';
import prisma from '../db.js'; // Import the Prisma Client instance
import checkAdminToken from '../middleware/authMiddleware.js';
import verifyToken from '../middleware/verifyToken.js';

// Create an Express router
const router = express.Router();

const allowedProductSortFields = {
  id: 'id',
  name: 'name',
  price: 'price',
  stock: 'stock',
  barcode: 'barcode',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

router.get('/', async (req, res) => {
  const { barcode, stockLevel, threshold, sortBy, sortOrder } = req.query;

  try {
      let whereClause = {};
      let orderByClause = {};

      // --- Handle barcode search (takes precedence) ---
      if (barcode) {
          // ... (keep existing barcode search logic) ...
          // findUnique doesn't use orderBy, so we can return early
          const product = await prisma.product.findUnique({ where: { barcode: String(barcode) } });
          if (!product) return res.status(404).json({ error: 'Product not found' });
          return res.status(200).json(product);
      }

      // --- Handle stock level filtering ---
      const lowStockThreshold = parseInt(threshold, 10) || 5;
      if (stockLevel === 'zero') {
          whereClause.stock = 0;
      } else if (stockLevel === 'low') {
          whereClause.stock = { gt: 0, lte: lowStockThreshold };
      }

      // --- Handle Sorting ---
      const sortKey = allowedProductSortFields[sortBy] || 'name'; // Default sort by name
      const order = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc'; // Default to asc
      orderByClause = { [sortKey]: order };
      console.log(`Sorting products by: ${sortKey} ${order}`); // Log sorting

      // --- Find Products with Filters and Sorting ---
      const products = await prisma.product.findMany({
          where: whereClause,
          orderBy: orderByClause, // Apply dynamic sorting
      });
      res.status(200).json(products);

  } catch (e) {
      console.error("Error fetching products:", e);
      res.status(500).json({ error: 'Could not fetch products' });
  }
});

// --- Define CRUD routes below ---

// GET /api/products - Modified to handle stock level filtering
router.get('/', async (req, res) => {
  const { barcode, stockLevel, threshold } = req.query; // Get potential query params

  try {
    let whereClause = {}; // Start with empty where clause

    // Handle barcode search (takes precedence if present)
    if (barcode) {
      whereClause.barcode = String(barcode);
      const product = await prisma.product.findUnique({ where: whereClause });
      if (!product) return res.status(404).json({ error: 'Product with this barcode not found' });
      return res.status(200).json(product);
    }

    // Handle stock level filtering
    const lowStockThreshold = parseInt(threshold, 10) || 5; // Default low stock threshold to 5 if not provided or invalid

    if (stockLevel === 'zero') {
      whereClause.stock = 0;
    } else if (stockLevel === 'low') {
      whereClause.stock = {
        gt: 0, // Greater than 0
        lte: lowStockThreshold, // Less than or equal to threshold
      };
    }
    // If no stockLevel specified, whereClause remains empty (or includes other filters if added later)

    // Find products based on constructed where clause
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
    res.status(200).json(products);

  } catch (e) {
    console.error("Error fetching products:", e);
    res.status(500).json({ error: 'Could not fetch products' });
  }
});

// GET /api/products - Get all products OR find one by barcode query param
router.get('/', async (req, res) => {
    const { barcode } = req.query; // Check if a barcode query parameter exists
  
    try {
      if (barcode) {
        // --- Find by Barcode ---
        const product = await prisma.product.findUnique({
          where: { barcode: String(barcode) } // Ensure barcode is treated as string
        });
  
        if (!product) {
          return res.status(404).json({ error: 'Product with this barcode not found' });
        }
        res.status(200).json(product);
  
      } else {
        // --- Find All Products ---
        const products = await prisma.product.findMany({
          orderBy: { name: 'asc' } // Optional: order by name
        });
        res.status(200).json(products);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
      res.status(500).json({ error: 'Could not fetch products' });
    }
  });

// GET /api/products/:id - Get a single product by its ID
router.get('/:id', async (req, res) => {
    const productId = parseInt(req.params.id, 10); // Get ID from URL parameter, convert to integer
  
    // Validate ID
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
  
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(200).json(product);
  
    } catch (e) {
      console.error("Error fetching product by ID:", e);
      res.status(500).json({ error: 'Could not fetch product' });
    }
  });

// POST /api/products - Create a new product
router.post('/', verifyToken, async (req, res) => {
    // Get data from request body
    const { name, description, price, barcode, stock } = req.body;
  
    // Basic validation (add more as needed)
    if (!name || price === undefined || !barcode) {
      return res.status(400).json({ error: 'Missing required fields: name, price, barcode' });
    }
  
    try {
      // Data type conversions and preparation
      const productData = {
        name,
        description: description || null, // Handle optional description
        price: parseFloat(price), // Convert string price from JSON to number/Decimal
        barcode,
        stock: stock !== undefined ? parseInt(stock, 10) : 0, // Convert string stock to integer, default 0
      };
  
      // Validate converted numbers
      if (isNaN(productData.price) || isNaN(productData.stock)) {
        return res.status(400).json({ error: 'Invalid number format for price or stock' });
      }
  
      // Use Prisma Client to create the product in the database
      const newProduct = await prisma.product.create({
        data: productData,
      });
  
      // Send back the created product with a 201 Created status
      res.status(201).json(newProduct);
  
    } catch (e) {
      console.error("Error creating product:", e);
      // Check for specific Prisma error for unique constraint violation (barcode)
      if (e.code === 'P2002' && e.meta?.target?.includes('barcode')) {
        return res.status(409).json({ error: 'Barcode already exists' }); // 409 Conflict
      }
      // Generic error response
      res.status(500).json({ error: 'Could not create product' });
    }
  });

// PUT /api/products/:id - Update an existing product
router.put('/:id', verifyToken, async (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const { name, description, price, barcode, stock } = req.body;
  
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
  
    // Prepare update data, only including fields that are provided in the request
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) {
      updateData.price = parseFloat(price);
      if (isNaN(updateData.price)) return res.status(400).json({ error: 'Invalid price format' });
    }
    if (barcode !== undefined) updateData.barcode = barcode;
    if (stock !== undefined) {
      updateData.stock = parseInt(stock, 10);
      if (isNaN(updateData.stock)) return res.status(400).json({ error: 'Invalid stock format' });
    }
  
    // Prevent updating with empty data
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No update data provided' });
    }
  
  
    try {
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
      });
      res.status(200).json(updatedProduct);
  
    } catch (e) {
      console.error("Error updating product:", e);
      // Handle case where the product to update doesn't exist
      if (e.code === 'P2025') {
         return res.status(404).json({ error: 'Product not found' });
      }
      // Handle potential unique constraint violation if updating barcode
      if (e.code === 'P2002' && e.meta?.target?.includes('barcode')) {
        return res.status(409).json({ error: 'Barcode already exists on another product' });
      }
      res.status(500).json({ error: 'Could not update product' });
    }
  });

// DELETE /api/products/:id - Delete a product
router.delete('/:id', verifyToken, async (req, res) => {
    const productId = parseInt(req.params.id, 10);
  
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
  
    try {
      await prisma.product.delete({
        where: { id: productId }
      });
      // Send a 204 No Content response on successful deletion
      res.status(204).send();
  
    } catch (e) {
      console.error("Error deleting product:", e);
      // Handle case where the product to delete doesn't exist
      if (e.code === 'P2025') {
         return res.status(404).json({ error: 'Product not found' });
      }
      res.status(500).json({ error: 'Could not delete product' });
    }
  });


// Export the router
export default router;