import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../common/middleware/auth.guard';
import { CartService } from '../service/cart.service';

const cartService = new CartService();

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const cart = await cartService.getCart(userId);
        res.json({ success: true, data: cart });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};

export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { productId, quantity } = req.body;

        if (!productId || typeof productId !== 'string' || !productId.trim()) {
            return next({ status: 400, message: 'productId is required' });
        }

        if (quantity !== undefined) {
            const parsed = Number(quantity);
            if (!Number.isFinite(parsed) || parsed < 1) {
                return next({ status: 400, message: 'quantity must be at least 1' });
            }
        }

        const item = await cartService.addToCart(userId, productId, quantity);
        res.status(201).json({ success: true, data: item });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};

export const updateQuantity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const { quantity } = req.body;

        const parsed = Number(quantity);
        if (!Number.isFinite(parsed) || parsed < 1) {
            return next({ status: 400, message: 'quantity must be at least 1' });
        }

        const updated = await cartService.updateQuantity(userId, id, quantity);
        res.json({ success: true, data: updated });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};

export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        await cartService.removeFromCart(userId, id);
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};

export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        await cartService.clearCart(userId);
        res.json({ success: true, message: 'Cart cleared' });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};
