"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./features/auth/routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./features/profile/routes/profile.routes"));
const app = (0, express_1.default)();
// Parse JSON
app.use(express_1.default.json());
// CORS setup
app.use((0, cors_1.default)({
    origin: 'http://localhost:4000', // frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // allow cookies or auth headers
}));
// Make sure preflight requests respond with proper headers
app.options('*', (0, cors_1.default)({
    origin: 'http://localhost:4000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
exports.default = app;
