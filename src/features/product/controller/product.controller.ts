
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductService } from '../service/product.service';
import { ProductRepository } from '../repository/product.repository';
import { ProductStatus } from '../dto/product.dto';
import { CategoryModel } from '../../category/entity/category.model';

const productService = new ProductService();
const productRepository = new ProductRepository();

export const createProduct = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one image is required' });
        }

        const payload: any = { ...req.body };
        if (payload.price !== undefined) payload.price = Number(payload.price);
        if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
        if (payload.negotiable !== undefined) {
            payload.negotiable = payload.negotiable === true || payload.negotiable === 'true';
        }

        const product = await productService.create(userId, payload, files);
        res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        // req.query is passed to service which handles filtering
        // We might want to parse pagination here
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const sort: any = {};
        if (req.query.sort) {
            const parts = (req.query.sort as string).split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const filter: any = { status: ProductStatus.AVAILABLE };

        if (req.query.search) {
            // Basic regex search since text index might need specific query structure or Atlas search
            const searchRegex = new RegExp(req.query.search as string, 'i');
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex }
            ];
        }
        if (req.query.category) {
            const categoryValue = req.query.category as string;
            if (mongoose.Types.ObjectId.isValid(categoryValue)) {
                filter.categoryId = categoryValue;
            } else {
                // If not a valid ObjectId, assume it's a slug
                const category = await CategoryModel.findOne({ slug: categoryValue });
                if (category) {
                    filter.categoryId = category._id;
                } else {
                    // If slug not found, return empty results by setting an impossible ID
                    filter.categoryId = new mongoose.Types.ObjectId();
                }
            }
        }
        if (req.query.campus) filter.campus = req.query.campus;
        if (req.query.condition) filter.condition = req.query.condition;

        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
        }

        const result = await productRepository.findAll(filter, skip, limit, sort);

        res.status(200).json({
            success: true,
            data: result.products,
            pagination: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await productService.findById(id);
        res.status(200).json({ success: true, data: product });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const getMyListings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const result = await productRepository.findByOwner(userId, skip, limit);

        res.status(200).json({
            success: true,
            data: result.products,
            pagination: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const payload: any = { ...req.body };
        if (payload.price !== undefined) payload.price = Number(payload.price);
        if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
        if (payload.negotiable !== undefined) {
            payload.negotiable = payload.negotiable === true || payload.negotiable === 'true';
        }

        const updatedProduct = await productService.update(userId, id, payload);
        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error: any) {
        const message = error?.message || 'Failed to update product';
        const status =
            message.includes('not found') ? 404 :
                message.includes('Unauthorized') ? 403 :
                    400;
        res.status(status).json({ success: false, message });
    }
};

export const changeProductStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const isAdmin = (req as any).user.role === 'admin';
        const { id } = req.params;
        const { status } = req.body;

        // Validate status transition if not admin?
        // Basic check
        if (!Object.values(ProductStatus).includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updated = await productService.changeStatus(userId, id, status, isAdmin);
        res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        const message = error?.message || 'Failed to update product status';
        const status =
            message.includes('not found') ? 404 :
                message.includes('Unauthorized') ? 403 :
                    400;
        res.status(status).json({ success: false, message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const isAdmin = (req as any).user.role === 'admin';
        const { id } = req.params;

        await productService.delete(userId, id, isAdmin);
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
        const message = error?.message || 'Failed to delete product';
        const status =
            message.includes('not found') ? 404 :
                message.includes('Unauthorized') ? 403 :
                    400;
        res.status(status).json({ success: false, message });
    }
};
