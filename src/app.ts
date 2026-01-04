import '../types/express';
import express from 'express';

const app = express();
app.use(express.json());

import authRoutes from './features/auth/routes/auth.routes';
import userRoutes from './features/user/routes/user.routes';
import listingRoutes from './features/listing/routes/listing.routes';
import notificationRoutes from './features/notification/routes/notification.routes';
import chatRoutes from './features/chat/routes/chat.routes';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

export default app;