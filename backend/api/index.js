const serverless = require('serverless-http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Always load environment variables FIRST
dotenv.config();

const app = require('../app');

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined.');
    }
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

const handler = serverless(app);

// Helper to add CORS headers to any response
const addCorsHeaders = (res) => {
  const origin = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',')[0].trim().replace(/\/+$/, '')
    : 'http://localhost:5173';
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie');
};

module.exports = async (req, res) => {
  // Always add CORS headers first
  addCorsHeaders(res);

  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      return res.status(200).json({ status: 'ok', mongoConfigured: !!process.env.MONGO_URI });
    }

    // Skip DB for unauthenticated auth-check
    const cookieHeader = req.headers?.cookie || '';
    const hasToken = /(?:^|;\s*)token=/.test(cookieHeader);
    const isAuthMe = req.method === 'GET' && req.url.startsWith('/api/auth/me');
    
    if (isAuthMe && !hasToken) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await connectToDatabase();
    return handler(req, res);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};