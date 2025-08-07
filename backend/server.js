// backend/server.js
require('dotenv').config();

console.log('[DEBUG] MONGODB_URI from env:', process.env.MONGODB_URI);

const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const path      = require('path');
const session   = require('express-session');
const MongoStore = require('connect-mongo');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ──────────────────────────────────────────
   Global Middleware
────────────────────────────────────────── */
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  })
);

// Session middleware - MUST be before routers
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your_session_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} – ${req.method} ${req.path}`);
  next();
});

/* ──────────────────────────────────────────
   MongoDB Connection
────────────────────────────────────────── */
const connectDB = async (retries = 5) => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas…');

    if (!process.env.MONGODB_URI)
      throw new Error('MONGODB_URI environment variable is not set');

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB Atlas Connected!');
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`🗃️ Database: ${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    if (retries > 0) {
      console.log(`🔄 Retrying… (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5_000);
    } else {
      console.error('💀 Max retries reached. Exiting…');
      process.exit(1);
    }
  }
};
connectDB();

/* ──────────────────────────────────────────
   Static File Serving - BEFORE 404 handlers
────────────────────────────────────────── */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ──────────────────────────────────────────
   Routers
────────────────────────────────────────── */
console.log('📁 Loading routers…');

// Auth router
try {
  const authRouter = require('./routes/auth');
  app.use('/api/auth', authRouter);
  console.log('✅ Auth router connected → /api/auth');
} catch (err) {
  console.error('❌ Failed to load auth router:', err.message);
  console.error('Full error:', err);
}

// Admin router (optional)
try {
  const adminRouter = require('./routes/admin');
  app.use('/api/admin', adminRouter);
  console.log('✅ Admin router connected → /api/admin');
} catch (err) {
  console.warn('ℹ️  No admin router found – skipping');
}

// Project router
try {
  const projectRouter = require('./routes/project');
  app.use('/api/projects', projectRouter);
  console.log('✅ Project router connected → /api/projects');
} catch (err) {
  console.error('❌ Failed to load project router:', err.message);
}

// Profile router
try {
  const profileRouter = require('./routes/profile');
  app.use('/api/profile', profileRouter);
  console.log('✅ Profile router connected → /api/profile');
} catch (err) {
  console.error('❌ Failed to load profile router:', err.message);
}

/* ──────────────────────────────────────────
   Health Check Route
────────────────────────────────────────── */
app.get('/test', (req, res) => {
  const state = ['disconnected', 'connected', 'connecting', 'disconnecting'][
    mongoose.connection.readyState
  ];
  res.json({
    message: 'WebSphere server is running!',
    timestamp: new Date().toISOString(),
    server_status: 'running',
    database_status: state,
    database_name: mongoose.connection.name,
    port: PORT,
    session_available: !!req.session,
    session_store: !!req.sessionStore
  });
});

// Session debug route (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/session', (req, res) => {
    res.json({
      session: req.session,
      sessionID: req.sessionID,
      user: req.session?.user || null
    });
  });
}

/* ──────────────────────────────────────────
   Global Error Handler - BEFORE 404 handlers
────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (err.message === 'Only images are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed.'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

/* ──────────────────────────────────────────
   Catch-All 404 Handlers — KEEP LAST
────────────────────────────────────────── */
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 API route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

app.use('*', (req, res) => {
  console.log(`❌ 404 route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/* ──────────────────────────────────────────
   Start Server
────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('🚀 WebSphere Server Started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 Test URL:  http://localhost:${PORT}/test`);
  console.log(`🔑 Auth URL:  http://localhost:${PORT}/api/auth/`);
  console.log(`📂 Uploads:   http://localhost:${PORT}/uploads/`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  // Log available routes
  console.log('\n📋 Available API Routes:');
  console.log('   GET  /test');
  console.log('   GET  /debug/session (dev only)');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/google');
  console.log('   POST /api/auth/freelancer/auto-tag-bio');
  console.log('   GET  /api/auth/test-route');
  console.log('   GET  /api/projects/my');
  console.log('   POST /api/projects');
  console.log('   GET  /uploads/profiles/* (static files)');
});

/* ──────────────────────────────────────────
   Graceful Shutdown
────────────────────────────────────────── */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server…');
  
  try {
    await mongoose.connection.close();
    console.log('📤 Database connection closed');
  } catch (err) {
    console.error('❌ Error closing database:', err);
  }
  
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('💥 Unhandled Promise Rejection:', err);
  console.error('Shutting down server due to unhandled promise rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('Shutting down server due to uncaught exception');
  process.exit(1);
});
