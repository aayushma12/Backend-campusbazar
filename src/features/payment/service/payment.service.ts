
import crypto from 'crypto';
import { TransactionModel } from '../entity/transaction.model';
import { ProductModel } from '../../product/entity/product.model';
import { OrderModel, OrderStatus } from '../../order/entity/order.model';

export class PaymentService {
    private secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q'; // eSewa RC test secret (full key)
    private productCode = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
    private successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`;
    private failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products`;

    constructor() {
        // DEBUG: log which key is loaded so we can verify after restart
        console.log('[PaymentService] Loaded eSewa config:');
        console.log('  product_code:', this.productCode);
        console.log('  secret_key starts with:', this.secretKey.substring(0, 4) + '...');
        console.log('  success_url:', this.successUrl);
    }

    /**
     * Generates HMAC-SHA256 signature for eSewa v2
     */
    generateSignature(totalAmount: string, transactionUuid: string, productCode: string): string {
        const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
        console.log('[eSewa] Signing:', data);
        const hmac = crypto.createHmac('sha256', this.secretKey);
        hmac.update(data);
        const sig = hmac.digest('base64');
        console.log('[eSewa] Signature:', sig);
        return sig;
    }

    /**
     * Initializes payment: creates transaction record and returns form fields
     */
    async initPayment(buyerId: string, productId: string) {
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');
        if (product.status !== 'available') throw new Error('Product is no longer available');
        if ((product.quantity ?? 0) < 1) throw new Error('Insufficient stock available');
        if (product.ownerId.toString() === buyerId) throw new Error('You cannot buy your own product');

        const transactionUuid = `PAY-${Date.now()}-${buyerId.substring(0, 8)}`;
        const amount = product.price;

        // Create transaction record
        const transaction = await TransactionModel.create({
            productId: product._id,
            productIds: [product._id],
            items: [{ productId: product._id, quantity: 1, unitPrice: product.price }],
            buyerId,
            sellerId: product.ownerId,
            amount,
            status: 'pending',
            transactionUUID: transactionUuid,
        });

        // Prepare eSewa fields
        const totalAmountStr = amount.toString();
        const signature = this.generateSignature(totalAmountStr, transactionUuid, this.productCode);

        const successUrlWithParams = this.successUrl;

        return {
            amount: totalAmountStr,
            tax_amount: '0',
            total_amount: totalAmountStr,
            transaction_uuid: transactionUuid,
            product_code: this.productCode,
            product_service_charge: '0',
            product_delivery_charge: '0',
            success_url: successUrlWithParams,
            failure_url: this.failureUrl,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            signature: signature
        };
    }

    async initCartPayment(buyerId: string, cartItems: any[]) {
        if (!cartItems.length) throw new Error('Cart is empty');

        let totalAmount = 0;
        const productIds: any[] = [];
        const sellers = new Set<string>();
        const normalizedItems: Array<{ productId: any; quantity: number; unitPrice: number; sellerId: string }> = [];

        for (const item of cartItems) {
            if (!item.productId) continue;

            const productId = item.productId._id || item.productId.id;
            const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
            const product = await ProductModel.findById(productId);

            if (!product || product.status !== 'available') {
                throw new Error('One or more products are no longer available');
            }

            if (product.ownerId.toString() === buyerId) {
                throw new Error('You cannot buy your own product');
            }

            if ((product.quantity ?? 0) < quantity) {
                throw new Error(`Only ${product.quantity} items available in stock.`);
            }

            totalAmount += product.price * quantity;
            productIds.push(product._id);
            sellers.add(product.ownerId.toString());
            normalizedItems.push({
                productId: product._id,
                quantity,
                unitPrice: product.price,
                sellerId: product.ownerId.toString(),
            });
        }

        // Round to avoid float precision issues (NPR prices are whole numbers)
        totalAmount = Math.round(totalAmount);

        const transactionUuid = `CART-${Date.now()}-${buyerId.substring(0, 5)}`;

        // Create transaction record
        await TransactionModel.create({
            productIds,
            items: normalizedItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
            buyerId,
            sellerId: Array.from(sellers)[0], // For now, associate with first seller. Better: platform ID
            amount: totalAmount,
            status: 'pending',
            transactionUUID: transactionUuid,
        });

        // Prepare eSewa fields
        const totalAmountStr = totalAmount.toString();
        const signature = this.generateSignature(totalAmountStr, transactionUuid, this.productCode);

        return {
            amount: totalAmountStr,
            tax_amount: '0',
            total_amount: totalAmountStr,
            transaction_uuid: transactionUuid,
            product_code: this.productCode,
            product_service_charge: '0',
            product_delivery_charge: '0',
            success_url: this.successUrl,
            failure_url: this.failureUrl,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            signature: signature
        };
    }

    /**
     * Verifies eSewa payment
     */
    async verifyPayment(transactionUuid: string, amount: string, transactionCode: string) {
        console.log(`[PaymentService] Verifying payment for UUID: "${transactionUuid}", Received Amount: "${amount}", Codes: "${transactionCode}"`);

        // Robust lookup: trim whitespace and use case-sensitive match (as IDs are sensitive)
        const cleanUuid = transactionUuid?.trim();
        const transaction = await TransactionModel.findOne({ transactionUUID: cleanUuid });

        if (!transaction) {
            console.error(`[PaymentService] Transaction NOT found in DB for UUID: "${cleanUuid}"`);
            // List some recent transactions for debug if needed
            const recent = await TransactionModel.find().sort({ createdAt: -1 }).limit(3);
            console.log(`[PaymentService] Recent transactions in DB: ${JSON.stringify(recent.map(t => t.transactionUUID))}`);
            throw new Error(`Transaction record not found for UUID: ${cleanUuid}`);
        }

        if (transaction.status === 'done') {
            console.log(`[PaymentService] Transaction ${cleanUuid} already marked as done.`);
            return transaction;
        }

        // Amount verification with number conversion
        const expectedAmount = Number(transaction.amount);
        const receivedAmount = Number(amount.toString().replace(/,/g, ''));

        if (expectedAmount !== receivedAmount) {
            console.error(`[PaymentService] Amount mismatch! DB Expected: ${expectedAmount}, eSewa Received: ${receivedAmount}`);
            transaction.status = 'failed';
            await transaction.save();
            throw new Error(`Amount mismatch: Expected ${expectedAmount}, Received ${receivedAmount}`);
        }

        console.log(`[PaymentService] Verification successful for ${cleanUuid}. Updating status and processing products...`);
        transaction.transactionCode = transactionCode;
        transaction.paidTime = new Date();

        // Process products (support both single product and cart)
        const lineItems = transaction.items && transaction.items.length > 0
            ? transaction.items
            : (transaction.productIds && transaction.productIds.length > 0)
                ? transaction.productIds.map((pid) => ({ productId: pid as any, quantity: 1, unitPrice: 0 }))
                : (transaction.productId ? [{ productId: transaction.productId, quantity: 1, unitPrice: 0 }] : []);

        console.log(`[PaymentService] Processing ${lineItems.length} product line items`);

        for (const lineItem of lineItems) {
            const pid = lineItem.productId;
            const quantity = Math.max(1, Math.floor(Number(lineItem.quantity) || 1));
            const product = await ProductModel.findById(pid);
            if (product) {
                if (product.ownerId.toString() === transaction.buyerId.toString()) {
                    throw new Error(`You cannot buy your own product (${pid})`);
                }

                if (product.status !== 'available') {
                    throw new Error(`Product ${pid} is no longer available`);
                }

                if ((product.quantity ?? 0) < quantity) {
                    throw new Error(`Only ${product.quantity} items available in stock.`);
                }

                console.log(`[PaymentService] Creating order for product ${pid}, qty ${quantity}, Buyer ${transaction.buyerId}, Seller ${product.ownerId}`);
                await OrderModel.create({
                    productId: product._id,
                    buyerId: transaction.buyerId,
                    sellerId: product.ownerId,
                    price: product.price,
                    quantity,
                    paymentMethod: 'eSewa',
                    paymentStatus: 'Paid',
                    status: OrderStatus.ACCEPTED
                });
            } else {
                console.warn(`[PaymentService] Product ${pid} not found during verify processing`);
            }
        }

        transaction.status = 'done';
        await transaction.save();

        return transaction;
    }

    async getTransactionByUuid(uuid: string) {
        return TransactionModel.findOne({ transactionUUID: uuid })
            .populate('productId', 'title images price')
            .populate('productIds', 'title images price')
            .populate('sellerId', 'name email profilePicture')
            .populate('buyerId', 'name email profilePicture');
    }

    async getUserTransactions(userId: string) {
        return TransactionModel.find({
            $or: [{ buyerId: userId }, { sellerId: userId }]
        })
            .populate('productId', 'title images price')
            .populate('productIds', 'title images price')
            .populate('sellerId', 'name email profilePicture')
            .populate('buyerId', 'name email profilePicture')
            .sort({ createdAt: -1 });
    }

    async getAllTransactions() {
        return TransactionModel.find()
            .populate('productId', 'title images price')
            .populate('productIds', 'title images price')
            .populate('sellerId', 'name email profilePicture')
            .populate('buyerId', 'name email profilePicture')
            .sort({ createdAt: -1 });
    }
}

