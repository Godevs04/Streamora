const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import configurations
const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import middleware
const errorHandler = require('./middlewares/errorHandler');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Configure Cloudinary
configureCloudinary();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Enable CORS with all options
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Logging middleware in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api', commentRoutes); // Using /api prefix for nested routes
app.use('/api/notifications', notificationRoutes);

// Health check route - accessible without auth
app.get('/health', (req, res) => {
  console.log('Health check endpoint accessed');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || 5000
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to Streamora API',
    version: '1.0.0',
    documentation: `${process.env.CLIENT_URL}/api-docs`
  });
});

// CORS test route
app.get('/cors-test', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.status(200).json({ 
    success: true, 
    message: 'CORS is working!',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    headers: req.headers
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Error handler middleware
app.use(errorHandler);

// Start server
const PORT = 5001; // Changed from 5000 to avoid conflicts
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server in production
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});
