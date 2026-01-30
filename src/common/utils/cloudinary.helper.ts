import cloudinary from '../config/cloudinary.config';
import { UploadApiResponse } from 'cloudinary';

/**
 * Upload image buffer to Cloudinary
 * @param fileBuffer - Image file buffer from multer
 * @param folder - Cloudinary folder name
 * @returns Cloudinary upload response with secure URL
 */
export const uploadToCloudinary = (
    fileBuffer: Buffer,
    folder: string = 'campus-bazar/profiles'
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 500, height: 500, crop: 'limit' }, // Limit max dimensions
                    { quality: 'auto' }, // Auto quality optimization
                    { fetch_format: 'auto' }, // Auto format selection
                ],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve(result);
                } else {
                    reject(new Error('Upload failed without error'));
                }
            }
        );

        // Convert buffer to stream and pipe to Cloudinary
        const bufferStream = require('stream').Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
    });
};

/**
 * Delete image from Cloudinary using public ID
 * @param publicId - Cloudinary public ID of the image
 * @returns Deletion result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns Public ID
 */
export const extractPublicId = (url: string): string => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts.slice(-3, -1).join('/');
    return `${folder}/${publicId}`;
};
