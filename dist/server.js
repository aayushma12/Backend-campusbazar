"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const mongoose_1 = require("./database/mongoose");
const PORT = process.env.PORT || 4000;
async function bootstrap() {
    try {
        await (0, mongoose_1.connectDB)();
        console.log('MongoDB connected');
        app_1.default.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Server bootstrap error:', err);
        process.exit(1);
    }
}
bootstrap();
