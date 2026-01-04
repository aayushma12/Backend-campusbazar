import express from 'express';
import authRoutes from './src/features/auth/routes/auth.routes';
// import other feature routes as needed

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
// Mount other features here

export = app;
