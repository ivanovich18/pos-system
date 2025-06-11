// pos-backend/server.js
import express from 'express';
import cors from 'cors'; // Import cors
import productRoutes from './routes/products.js'; // Import the product router
import transactionRoutes from './routes/transactions.js'; // Import the transaction router
import dashboardRoutes from './routes/dashboard.js'; // Import the dashboard router
import authRoutes from './routes/auth.js'; // Import the auth router

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Enable CORS for all origins (adjust origins in production)
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

app.use('/api/auth', authRoutes); // Mount auth routes

app.use('/api/transactions', transactionRoutes); // Mount transaction routes

// --- Routes ---
// Basic test route for the API root
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to POS Backend API v1' });
});

// Mount the product routes - all requests starting with /api/products will go here
app.use('/api/products', productRoutes);

app.use('/api/dashboard', dashboardRoutes); // Mount dashboard routes

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});