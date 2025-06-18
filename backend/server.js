const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db.config');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Client Management API' });
});

// Import routes
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const clientRoutes = require('./routes/client.routes');
const userRoutes = require('./routes/user.routes');
const financeRoutes = require('./routes/finance.routes');

// Use routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/finance', financeRoutes);

// Test database connection
async function testDatabaseConnection() {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('Successfully connected to MySQL database');
    console.log('Number of users in database:', rows[0].count);
  } catch (error) {
    console.error('Error connecting to the database:', error);
    console.error('Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'client_management'
    });
  }
}

testDatabaseConnection();

// Example route with database test
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM users');
    res.json({ 
      message: 'Backend is working!',
      userCount: rows[0].count
    });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({ 
      message: 'Error connecting to database',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
}); 