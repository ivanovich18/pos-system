// pos-backend/routes/auth.js
import express from 'express';
import prisma from '../db.js';
import bcrypt from 'bcryptjs'; // Use bcryptjs
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Load .env variables into process.env

const router = express.Router();
const saltRounds = 10; // Cost factor for hashing

// --- POST /api/auth/register ---
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Basic Validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) { // Example: Minimum password length
    return res.status(400).json({ error: 'Password must be at least 6 characters long'});
  }

  try {
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' }); // 409 Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
      },
      // Select only safe fields to return (omit password)
      select: { id: true, username: true, createdAt: true }
    });

    res.status(201).json({ message: 'User created successfully', user: user });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// --- POST /api/auth/login ---
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find user by username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      // Use a generic message to avoid revealing if username exists
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare submitted password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // --- Passwords match: Generate JWT ---
    const payload = {
      userId: user.id,
      username: user.username,
      // Add role here if you implement it: role: user.role
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
         console.error("JWT_SECRET not set in environment variables!");
         return res.status(500).json({error: "Internal server configuration error"});
    }

    const options = {
      expiresIn: '1d', // Token expires in 1 day (e.g., '1h', '7d')
    };

    const token = jwt.sign(payload, secret, options);

    // Send token back to client
    res.status(200).json({ message: 'Login successful', token: token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

export default router;