// server.js
import app from './app.js';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database.js';

dotenv.config();

// Initialize database connection
connectToDatabase().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
