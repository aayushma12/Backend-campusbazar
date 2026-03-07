import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './features/auth/routes/auth.routes';
import profileRoutes from './features/profile/routes/profile.routes';
import productRoutes from './features/product/routes/product.routes';
import categoryRoutes from './features/category/routes/category.routes';
import cartRoutes from './features/cart/routes/cart.routes';
import wishlistRoutes from './features/wishlist/routes/wishlist.routes';
import orderRoutes from './features/order/routes/order.routes';
import paymentRoutes from './features/payment/routes/payment.routes';
import tutorRoutes from './features/tutor/routes/tutor.routes';
import bookingRoutes from './features/booking/routes/booking.routes';
import chatRoutes from './features/chat/routes/chat.routes';
import notificationRoutes from './features/notification/routes/notification.routes';
import reportRoutes from './features/report/routes/report.routes';
import adminRoutes from './features/admin/routes/admin.routes';

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
  const requestPath = req.originalUrl || req.url;
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`>>> [${new Date().toISOString()}] ${req.method} ${requestPath} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 3. Standard Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
// Backward-compatible legacy alias (kept to avoid breaking older clients/docs)
app.use('/api/profile', profileRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/tutor', tutorRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'CampusBazar API is running' });
});

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
