import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusbazar';

async function check() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const users = await db?.collection('users').find({ email: 'admin@campusbazar.com' }).toArray();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

check();
