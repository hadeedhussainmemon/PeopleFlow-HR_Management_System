require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../app');

let cachedDb = null;

async function connectDB() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const db = await mongoose.connect(process.env.MONGO_URI);
  cachedDb = db;
  return db;
}

module.exports = async (req, res) => {
  try {
    await connectDB();
    app(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};