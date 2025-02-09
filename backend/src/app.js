const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { poolPromise } = require('./db');  // Import the poolPromise from db.js
const userRoutes = require('./routes/userRoutes');
const permitRoutes = require('./routes/permitRoutes');

const app = express();

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // frontend's URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  }));

app.use(express.json());

app.use(cookieParser());
// app.use(session({
//   secret: 'your-secret-key',  // Use a secure secret in production
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production', // true in production
//     sameSite: 'lax',
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
//   }
// }));

// Test database connection
async function connectDB() {
  try {
    await poolPromise; // Wait for the pool to connect
    console.log('Connected to MSSQL database');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit if database connection fails
  }
}

// Initialize database connection
connectDB();

// Make database connection available to routes
app.locals.db = poolPromise;

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/permits', permitRoutes);
// app.use('/api/departments', )

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});