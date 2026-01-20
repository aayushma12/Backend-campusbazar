import express from 'express';
import cors from 'cors';
import authRoutes from './src/features/auth/routes/auth.routes';
import userRoutes from './src/features/user/routes/user.routes';
const app = express();

// Parse JSON
app.use(express.json());

// ========================
// CORS setup
// ========================
app.use(cors({
  origin: 'http://localhost:3000',   // frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,                 // allow cookies or auth headers
}));

// Make sure preflight OPTIONS requests respond correctly
app.options('*', cors());

// ========================
// Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

export default app;
