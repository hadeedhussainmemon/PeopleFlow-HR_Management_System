const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 5000;

const seedAdmin = require('./utils/seeder');

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  seedAdmin();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error(err));
