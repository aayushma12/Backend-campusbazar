import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './features/auth/routes/auth.routes';
import profileRoutes from './features/profile/routes/profile.routes';

import { trimBody } from './common/middleware/trim-body.middleware';

const app = express();

// 1. CORS - MUST BE FIRST (More robust development setup)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

// 2. Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`>>> [${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 3. Standard Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
