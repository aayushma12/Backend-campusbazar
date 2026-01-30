import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Force override any existing system/user environment variables
dotenv.config({ override: true });

// Configure Cloudinary
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

console.log('--- CLOUDINARY CONFIG DEBUG ---');
console.log(`Cloud Name: [${cloudName}] (Length: ${cloudName.length})`);
console.log(`API Key: [${apiKey}] (Length: ${apiKey.length})`);
console.log(`API Secret: [${apiSecret.substring(0, 4)}...] (Length: ${apiSecret.length})`);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;
