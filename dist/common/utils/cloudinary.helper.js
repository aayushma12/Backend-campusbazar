"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicId = exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
/**
 * Upload image buffer to Cloudinary
 * @param fileBuffer - Image file buffer from multer
 * @param folder - Cloudinary folder name
 * @returns Cloudinary upload response with secure URL
 */
const uploadToCloudinary = (fileBuffer, folder = 'campus-bazar/profiles') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_config_1.default.uploader.upload_stream({
            folder: folder,
            resource_type: 'image',
            transformation: [
                { width: 500, height: 500, crop: 'limit' }, // Limit max dimensions
                { quality: 'auto' }, // Auto quality optimization
                { fetch_format: 'auto' }, // Auto format selection
            ],
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve(result);
            }
            else {
                reject(new Error('Upload failed without error'));
            }
        });
        // Convert buffer to stream and pipe to Cloudinary
        const bufferStream = require('stream').Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Delete image from Cloudinary using public ID
 * @param publicId - Cloudinary public ID of the image
 * @returns Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary_config_1.default.uploader.destroy(publicId);
        return result;
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns Public ID
 */
const extractPublicId = (url) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts.slice(-3, -1).join('/');
    return `${folder}/${publicId}`;
};
exports.extractPublicId = extractPublicId;
