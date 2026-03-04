"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./features/auth/routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./features/profile/routes/profile.routes"));
const product_routes_1 = __importDefault(require("./features/product/routes/product.routes"));
const category_routes_1 = __importDefault(require("./features/category/routes/category.routes"));
const cart_routes_1 = __importDefault(require("./features/cart/routes/cart.routes"));
const wishlist_routes_1 = __importDefault(require("./features/wishlist/routes/wishlist.routes"));
const order_routes_1 = __importDefault(require("./features/order/routes/order.routes"));
const payment_routes_1 = __importDefault(require("./features/payment/routes/payment.routes"));
const tutor_routes_1 = __importDefault(require("./features/tutor/routes/tutor.routes"));
const booking_routes_1 = __importDefault(require("./features/booking/routes/booking.routes"));
const chat_routes_1 = __importDefault(require("./features/chat/routes/chat.routes"));
const notification_routes_1 = __importDefault(require("./features/notification/routes/notification.routes"));
const report_routes_1 = __importDefault(require("./features/report/routes/report.routes"));
const admin_routes_1 = __importDefault(require("./features/admin/routes/admin.routes"));
const app = (0, express_1.default)();
// 1. CORS - MUST BE FIRST (More robust development setup)
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));
// 2. Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`>>> [${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});
// 3. Standard Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/profile', profile_routes_1.default);
app.use('/api/v1/products', product_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api/v1/cart', cart_routes_1.default);
app.use('/api/v1/wishlist', wishlist_routes_1.default);
app.use('/api/v1/orders', order_routes_1.default);
app.use('/api/v1/payment', payment_routes_1.default);
app.use('/api/v1/tutor', tutor_routes_1.default);
app.use('/api/v1/bookings', booking_routes_1.default);
app.use('/api/v1/chats', chat_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/reports', report_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'CampusBazar API is running' });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('--- GLOBAL ERROR HANDLER ---');
    if (err && typeof err === 'object') {
        console.error('Error Details:', JSON.stringify(err, null, 2));
    }
    else {
        console.error('Error Details:', err);
    }
    if (err && err.stack)
        console.error('Stack Trace:', err.stack);
    const status = err.status || err.statusCode || 500;
    const message = err.message || (typeof err === 'string' ? err : 'Internal Server Error');
    res.status(status).json({
        success: false,
        message,
        errors: err.errors // For validation errors if passed this way
    });
});
exports.default = app;
