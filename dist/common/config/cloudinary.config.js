"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
// Force override any existing system/user environment variables
dotenv_1.default.config({ override: true });
// Configure Cloudinary
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
console.log('--- CLOUDINARY CONFIG DEBUG ---');
console.log(`Cloud Name: [${cloudName}] (Length: ${cloudName.length})`);
console.log(`API Key: [${apiKey}] (Length: ${apiKey.length})`);
console.log(`API Secret: [${apiSecret.substring(0, 4)}...] (Length: ${apiSecret.length})`);
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});
exports.default = cloudinary_1.v2;
