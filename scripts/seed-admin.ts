import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Define the schema here to avoid complex imports in a standalone script
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusbazar';

async function seed() {
    try {
        console.log('Connecting to MongoDB at:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully');

        const adminEmail = 'admin@campusbazar.com';
        const existingAdmin = await UserModel.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists! You can log in with:');
            console.log('Email:', adminEmail);
            console.log('Password: Admin@123');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await UserModel.create({
            name: 'System Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });

        console.log('-----------------------------------');
        console.log('✅ Admin user created successfully!');
        console.log('Email: ', adminEmail);
        console.log('Password: Admin@123');
        console.log('-----------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seed();
