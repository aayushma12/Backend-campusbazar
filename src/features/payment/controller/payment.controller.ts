
import { Request, Response } from 'express';
import { PaymentService } from '../service/payment.service';

const paymentService = new PaymentService();

export const initPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const data = await paymentService.initPayment(userId, productId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const initCartPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { cartItems } = req.body;

        if (!cartItems || !cartItems.length) {
            return res.status(400).json({ success: false, message: 'Cart items are required' });
        }

        // DEBUG: log incoming cart items
        console.log('[initCartPayment] Cart items received:', JSON.stringify(cartItems.map((i: any) => ({
            productIdType: typeof i.productId,
            price: i.productId?.price,
            quantity: i.quantity,
            ownerId: i.productId?.ownerId,
        })), null, 2));

        const data = await paymentService.initCartPayment(userId, cartItems);

        // DEBUG: log the exact data returned
        console.log('[initCartPayment] eSewa form data:', JSON.stringify(data, null, 2));

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[initCartPayment] ERROR:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { transactionUUID, amount, transactionCode } = req.body;

        if (!transactionUUID || !amount || !transactionCode) {
            return res.status(400).json({ success: false, message: 'Missing verification data' });
        }

        const transaction = await paymentService.verifyPayment(transactionUUID, amount, transactionCode);
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: transaction
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const transaction = await paymentService.getTransactionByUuid(id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.status(200).json({ success: true, data: transaction });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const transactions = user.role === 'admin'
            ? await paymentService.getAllTransactions()
            : await paymentService.getUserTransactions(user.id);
        res.status(200).json({ success: true, data: transactions });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
