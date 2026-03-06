import 'dotenv/config';
import app from './app';
import { connectDB } from './database/mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupChatSocket } from './features/chat/socket/chat.socket';
import { setChatSocketServer } from './features/chat/socket/chat.gateway';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await connectDB();
    console.log('MongoDB connected');

    const httpServer = createServer(app);

    const io = new SocketServer(httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    setChatSocketServer(io);
    setupChatSocket(io);

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();
