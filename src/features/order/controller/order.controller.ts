import { Request, Response } from 'express';
import { OrderService } from '../service/order.service';
import { OrderStatus } from '../entity/order.model';

const orderService = new OrderService();

export const getOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const type = (req.query.type as string | undefined)?.toLowerCase() ?? 'buyer';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = type === 'seller'
            ? await orderService.getMySales(userId, page, limit)
            : await orderService.getMyPurchases(userId, page, limit);

        res.status(200).json({ success: true, data: result.orders, total: result.total });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id: orderId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!orderId || typeof orderId !== 'string') {
            return res.status(400).json({ success: false, message: 'Valid orderId is required' });
        }

        const order = await orderService.getOrderByIdForUser(userId, orderId);

        if (!order) {
            const existingOrder = await orderService.getOrderById(orderId);
            if (existingOrder) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const populatedProduct = (order as any).productId;
        const unitPrice = typeof order.price === 'number' ? order.price : 0;
        const quantity = typeof order.quantity === 'number' && order.quantity > 0 ? order.quantity : 1;
        const totalPrice = unitPrice * quantity;

        return res.status(200).json({
            success: true,
            data: {
                ...order.toJSON(),
                orderItems: [
                    {
                        productId: typeof populatedProduct === 'object' ? (populatedProduct?._id ?? populatedProduct?.id ?? populatedProduct) : populatedProduct,
                        product: typeof populatedProduct === 'object' ? populatedProduct : null,
                        quantity,
                        unitPrice,
                        totalPrice,
                    }
                ],
                totalPrice,
            },
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const {
            productId,
            price,
            quantity,
            paymentMethod,
            paymentStatus,
        } = req.body;

        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ success: false, message: 'Valid productId is required' });
        }

        if (price != null && Number.isNaN(Number(price))) {
            return res.status(400).json({ success: false, message: 'Invalid price value' });
        }

        const parsedQty = quantity == null ? 1 : Number(quantity);
        if (!Number.isFinite(parsedQty) || parsedQty < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        const order = await orderService.createOrder(userId, productId, price, {
            quantity: parsedQty,
            paymentMethod,
            paymentStatus,
        });
        res.status(201).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const createBulkCodOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const rawItems = req.body?.items;

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return res.status(400).json({ success: false, message: 'items must be a non-empty array' });
        }

        const items = rawItems.map((item: any) => ({
            productId: (item?.productId ?? '').toString(),
            quantity: item?.quantity == null ? 1 : Number(item.quantity),
            price: item?.price == null ? undefined : Number(item.price),
        }));

        for (const item of items) {
            if (!item.productId || Number.isNaN(item.quantity) || item.quantity < 1) {
                return res.status(400).json({ success: false, message: 'Each item requires valid productId and quantity >= 1' });
            }
            if (item.price != null && Number.isNaN(item.price)) {
                return res.status(400).json({ success: false, message: 'Invalid item price value' });
            }
        }

        const orders = await orderService.createBulkCodOrders(userId, items);
        res.status(201).json({ success: true, data: { orders } });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyPurchases = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await orderService.getMyPurchases(userId, page, limit);
        res.status(200).json({ success: true, data: result.orders, total: result.total });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMySales = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await orderService.getMySales(userId, page, limit);
        res.status(200).json({ success: true, data: result.orders, total: result.total });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMySalesMetrics = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const metrics = await orderService.getSellerMetrics(userId);
        res.status(200).json({ success: true, data: metrics });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const acceptOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const order = await orderService.acceptOrder(userId, id);
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const rejectOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { reason } = req.body;
        const order = await orderService.rejectOrder(userId, id, reason);
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const markHandedOver = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const order = await orderService.markHandedOver(userId, id);
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const completeOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const order = await orderService.completeOrder(userId, id);
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const order = await orderService.cancelOrder(userId, id);
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const disputedOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const order = await orderService.openDispute(userId, id);
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const adminGetAllOrders = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await orderService.getAllOrders(page, limit);
        res.status(200).json({ success: true, data: result.orders, total: result.total });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminResolveDispute = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // should be 'completed' or 'cancelled'
        const order = await orderService.resolveDispute(id, status);
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
