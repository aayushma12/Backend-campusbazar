
import { Request, Response } from 'express';
import { WishlistService } from '../service/wishlist.service';

const service = new WishlistService();

export const addToWishlist = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const result = await service.addToWishlist(userId, productId);
        return res.status(200).json({ success: true, message: 'Added to wishlist', data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId } = req.params;
        await service.removeFromWishlist(userId, productId);
        return res.status(200).json({ success: true, message: 'Removed from wishlist' });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getWishlist = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await service.getWishlist(userId, page, limit);
        return res.status(200).json({
            success: true,
            data: result.items,
            pagination: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
