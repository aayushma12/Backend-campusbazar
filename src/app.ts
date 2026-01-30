import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './features/auth/routes/auth.routes';
import profileRoutes from './features/profile/routes/profile.routes';

import { trimBody } from './common/middleware/trim-body.middleware';

const app = express();

// Basic Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n>>> [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(trimBody); // Moved to specific routes for multipart support

// CORS setup
app.use(cors({
  origin: '*',                      // Allow all for testing - change to frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Make sure preflight requests respond with proper headers
app.options('*', cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('--- GLOBAL ERROR HANDLER ---');
  if (err && typeof err === 'object') {
    console.error('Error Details:', JSON.stringify(err, null, 2));
  } else {
    console.error('Error Details:', err);
  }
  if (err && err.stack) console.error('Stack Trace:', err.stack);

  const status = err.status || err.statusCode || 500;
  const message = err.message || (typeof err === 'string' ? err : 'Internal Server Error');

  res.status(status).json({
    success: false,
    message,
    errors: err.errors // For validation errors if passed this way
  });
});

export default app;
