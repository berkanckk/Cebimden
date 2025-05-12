const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');
const { initializeFirebaseAdmin } = require('./utils/firebaseAdmin');
const cors = require('cors');
const morgan = require('morgan');

// Routes
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Environment variables
dotenv.config();

// Initialize Express
const app = express();

// Set port
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Start server
const startServer = async () => {
  try {
    // Database connection
    await sequelize.authenticate();
    console.log('Database connection established');
    
    // Firebase Admin SDK'yı başlat
    initializeFirebaseAdmin();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server start error:', error);
    process.exit(1);
  }
};

startServer(); 