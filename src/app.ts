import express from 'express';
import cors from 'cors';
import authRoutes from './features/auth/routes/auth.routes';
import userRoutes from './features/user/routes/user.routes';

const app = express();

// Parse JSON
app.use(express.json());

// CORS setup
app.use(cors({
  origin: 'http://localhost:3000',  // frontend URL
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,                // allow cookies or auth headers
}));

// Make sure preflight requests respond with proper headers
app.options('*', cors({
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

export default app;
