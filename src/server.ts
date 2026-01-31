import 'dotenv/config';
import app from './app';
import { connectDB } from './database/mongoose';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await connectDB();
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();
