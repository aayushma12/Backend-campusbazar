"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDB = connectDB;
// Prisma database connection setup
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
async function connectDB() {
    try {
        await exports.prisma.$connect();
        console.log('Connected to database');
    }
    catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}
