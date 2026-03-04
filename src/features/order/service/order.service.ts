import mongoose from 'mongoose';
import { OrderRepository } from '../repository/order.repository';
import { OrderModel } from '../entity/order.model';
import { OrderStatus } from '../entity/order.model';
import { ProductModel } from '../../product/entity/product.model';
import { NotificationService } from '../../notification/service/notification.service';

export class OrderService {
    private repository = new OrderRepository();
    private notificationService = new NotificationService();

    private isTransactionUnsupportedError(error: any): boolean {
        const message = String(error?.message ?? '').toLowerCase();
        return (
            message.includes('transaction numbers are only allowed on a replica set member or mongos') ||
            message.includes('replica set member or mongos') ||
            error?.code === 20
        );
    }

    private async runWithOptionalTransaction<T>(
        operation: (session: mongoose.ClientSession | null) => Promise<T>
    ): Promise<T> {
        const session = await mongoose.startSession();

        try {
            let result: T | undefined;
            await session.withTransaction(async () => {
                result = await operation(session);
            });
            return result as T;
        } catch (error) {
            if (!this.isTransactionUnsupportedError(error)) {
                throw error;
            }

            return operation(null);
        } finally {
            await session.endSession();
        }
    }

    private async notifyOrderStatusChangeSafe(params: {
        orderId: string;
        oldStatus: OrderStatus;
        newStatus: OrderStatus;
        buyerId: string;
        sellerId: string;
        actorName?: string;
        productName?: string;
    }) {
        if (params.oldStatus === params.newStatus) return;

        try {
            await this.notificationService.notifyOrderStatusChanged({
                orderId: params.orderId,
                oldStatus: params.oldStatus,
                newStatus: params.newStatus,
                buyerId: params.buyerId,
                sellerId: params.sellerId,
                actorName: params.actorName,
                productName: params.productName,
            });
        } catch (error: any) {
            await this.appendAuditEntry({
                orderId: params.orderId,
                status: params.newStatus,
                actorUserId: undefined,
                note: 'Order status changed, but notification dispatch failed',
                metadata: {
                    error: error?.message || 'Unknown notification error',
                    oldStatus: params.oldStatus,
                    newStatus: params.newStatus,
                },
            });
        }
    }

    private buildStatusAuditEntry(params: {
        status: OrderStatus;
        changedBy?: string;
        note?: string;
        metadata?: Record<string, unknown>;
    }) {
        return {
            status: params.status,
            changedBy: params.changedBy as any,
            changedAt: new Date(),
            note: params.note,
            metadata: params.metadata,
        };
    }

    private async updateStatusWithAudit(params: {
        orderId: string;
        status: OrderStatus;
        actorUserId?: string;
        note?: string;
        metadata?: Record<string, unknown>;
        additionalSet?: Record<string, unknown>;
    }) {
        const $set: Record<string, unknown> = {
            status: params.status,
            ...(params.additionalSet ?? {}),
        };

        return this.repository.update(params.orderId, {
            $set,
            $push: {
                statusHistory: this.buildStatusAuditEntry({
                    status: params.status,
                    changedBy: params.actorUserId,
                    note: params.note,
                    metadata: params.metadata,
                })
            }
        });
    }

    private async appendAuditEntry(params: {
        orderId: string;
        status: OrderStatus;
        actorUserId?: string;
        note?: string;
        metadata?: Record<string, unknown>;
    }) {
        return this.repository.update(params.orderId, {
            $push: {
                statusHistory: this.buildStatusAuditEntry({
                    status: params.status,
                    changedBy: params.actorUserId,
                    note: params.note,
                    metadata: params.metadata,
                })
            }
        });
    }

    async getOrderById(orderId: string) {
        return this.repository.findById(orderId);
    }

    async getOrderByIdForUser(userId: string, orderId: string) {
        return this.repository.findByIdForUser(orderId, userId);
    }

    async createOrder(
        buyerId: string,
        productId: string,
        offeredPrice?: number,
        options?: {
            quantity?: number;
            paymentMethod?: 'COD' | 'eSewa';
            paymentStatus?: 'Pending' | 'Paid' | 'Failed';
        }
    ) {
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');
        if ((product.quantity ?? 0) <= 0) throw new Error('Insufficient stock available');
        if (product.ownerId.toString() === buyerId) throw new Error('You cannot buy your own product');

        const quantity = options?.quantity && options.quantity > 0 ? Math.floor(options.quantity) : 1;
        if (quantity > (product.quantity ?? 0)) {
            throw new Error(`Only ${product.quantity} items available in stock.`);
        }
        const paymentMethod = options?.paymentMethod === 'eSewa' ? 'eSewa' : 'COD';
        const paymentStatus = paymentMethod === 'COD'
            ? 'Pending'
            : (options?.paymentStatus === 'Paid' ? 'Paid' : 'Pending');

        const existing = await this.repository.findAll(
            {
                buyerId,
                productId,
                status: { $in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.HANDED_OVER] }
            },
            0,
            1
        );
        if (existing.total > 0) throw new Error('You already have an active order for this product');

        // Reserve visibility for single-stock items only.
        const reserveForSingleItem = (product.quantity ?? 0) <= 1;
        const reservedProduct = await ProductModel.findOneAndUpdate(
            {
                _id: productId,
                status: 'available',
                quantity: { $gte: quantity },
            },
            reserveForSingleItem ? { status: 'reserved' } : {},
            { new: true }
        );

        if (!reservedProduct) {
            throw new Error('Product is not available for purchase');
        }

        try {
            const createdOrder = await this.repository.create({
                productId: productId as any,
                buyerId: buyerId as any,
                sellerId: reservedProduct.ownerId,
                price: offeredPrice || reservedProduct.price,
                quantity,
                paymentMethod,
                paymentStatus,
                status: OrderStatus.ACCEPTED,
                statusHistory: [
                    this.buildStatusAuditEntry({
                        status: OrderStatus.ACCEPTED,
                        changedBy: buyerId,
                        note: 'Order created by buyer',
                    })
                ]
            });

            await this.notificationService.notifyNewOrderPlaced({
                sellerId: reservedProduct.ownerId.toString(),
                buyerName: 'A buyer',
                orderId: createdOrder._id.toString(),
                productName: reservedProduct.title,
            });

            return createdOrder;
        } catch (error) {
            // rollback reservation if order creation fails
            if (reserveForSingleItem && reservedProduct.status === 'reserved') {
                reservedProduct.status = 'available';
                await reservedProduct.save();
            }
            throw error;
        }
    }

    async createBulkCodOrders(
        buyerId: string,
        items: Array<{ productId: string; quantity?: number; price?: number }>
    ) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('At least one item is required for bulk COD order');
        }

        const createdOrderIds = await this.runWithOptionalTransaction<string[]>(async (session) => {
            const localCreatedIds: string[] = [];

            for (const item of items) {
                const productId = item.productId?.toString().trim();
                const quantity = item.quantity && item.quantity > 0 ? Math.floor(item.quantity) : 1;

                if (!productId) {
                    throw new Error('Invalid productId in bulk COD items');
                }

                const activeOrderQuery = OrderModel.countDocuments({
                    buyerId,
                    productId,
                    status: { $in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.HANDED_OVER] }
                });
                if (session) {
                    activeOrderQuery.session(session);
                }

                const activeOrdersCount = await activeOrderQuery;

                if (activeOrdersCount > 0) {
                    throw new Error('You already have an active order for one of the selected products');
                }

                const reservedProduct = await ProductModel.findOneAndUpdate(
                    {
                        _id: productId,
                        status: 'available',
                        quantity: { $gte: quantity },
                        ownerId: { $ne: buyerId as any },
                    },
                    { $set: { status: 'available' } },
                    {
                        new: true,
                        ...(session ? { session } : {})
                    }
                );

                if (!reservedProduct) {
                    throw new Error('One or more products are no longer available');
                }

                const finalPrice = (typeof item.price === 'number' && item.price > 0)
                    ? item.price
                    : reservedProduct.price;

                const orderPayload = {
                    productId: reservedProduct._id,
                    buyerId: buyerId as any,
                    sellerId: reservedProduct.ownerId,
                    price: finalPrice,
                    quantity,
                    paymentMethod: 'COD' as const,
                    paymentStatus: 'Pending' as const,
                    status: OrderStatus.ACCEPTED,
                    statusHistory: [
                        this.buildStatusAuditEntry({
                            status: OrderStatus.ACCEPTED,
                            changedBy: buyerId,
                            note: 'Bulk COD order created by buyer',
                        })
                    ],
                };

                const created = session
                    ? await OrderModel.create([orderPayload], { session })
                    : await OrderModel.create([orderPayload]);

                localCreatedIds.push(created[0]._id.toString());
            }

            return localCreatedIds;
        });

        const createdOrders = await Promise.all(createdOrderIds.map((id) => this.repository.findById(id)));
        const hydratedOrders = createdOrders.filter(Boolean);

        for (const created of hydratedOrders) {
            try {
                await this.notificationService.notifyNewOrderPlaced({
                    sellerId: (created as any).sellerId?._id?.toString() || created!.sellerId.toString(),
                    buyerName: (created as any).buyerId?.name?.toString?.() || 'A buyer',
                    orderId: created!._id.toString(),
                    productName: (created as any).productId?.title,
                });
            } catch {
                // Non-critical: order creation should not fail due to notification issues.
            }
        }

        return hydratedOrders;
    }

    async getMyPurchases(buyerId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.repository.findAll({ buyerId }, skip, limit);
    }

    async getMySales(sellerId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.repository.findAll({ sellerId }, skip, limit);
    }

    async acceptOrder(userId: string, orderId: string) {
        const order = await this.repository.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.sellerId._id.toString() !== userId) throw new Error('Unauthorized');
        if (order.status !== OrderStatus.PENDING) throw new Error('Order is not in pending status');

        // Lock the product
        const product = await ProductModel.findById(order.productId);
        if (!product || product.status !== 'available') throw new Error('Product is no longer available');

        product.status = 'reserved';
        await product.save();

        const updated = await this.updateStatusWithAudit({
            orderId,
            status: OrderStatus.ACCEPTED,
            actorUserId: userId,
            note: 'Seller accepted order',
        });

        await this.notifyOrderStatusChangeSafe({
            orderId,
            oldStatus: order.status,
            newStatus: OrderStatus.ACCEPTED,
            buyerId: order.buyerId._id.toString(),
            sellerId: order.sellerId._id.toString(),
            actorName: (order.sellerId as any)?.name,
            productName: (order.productId as any)?.title,
        });

        return updated;
    }

    async rejectOrder(userId: string, orderId: string, reason: string) {
        const order = await this.repository.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.sellerId._id.toString() !== userId) throw new Error('Unauthorized');
        if (order.status !== OrderStatus.PENDING) throw new Error('Order is not in pending status');

        const updated = await this.updateStatusWithAudit({
            orderId,
            status: OrderStatus.CANCELLED,
            actorUserId: userId,
            note: 'Seller rejected order',
            additionalSet: {
                rejectionReason: reason
            }
        });

        await this.notifyOrderStatusChangeSafe({
            orderId,
            oldStatus: order.status,
            newStatus: OrderStatus.CANCELLED,
            buyerId: order.buyerId._id.toString(),
            sellerId: order.sellerId._id.toString(),
            actorName: (order.sellerId as any)?.name,
            productName: (order.productId as any)?.title,
        });

        return updated;
    }

    async markHandedOver(userId: string, orderId: string) {
        const order = await this.repository.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.sellerId._id.toString() !== userId) throw new Error('Unauthorized');
        if (order.status !== OrderStatus.ACCEPTED) throw new Error('Order must be accepted first');

        const updated = await this.updateStatusWithAudit({
            orderId,
            status: OrderStatus.HANDED_OVER,
            actorUserId: userId,
            note: 'Seller marked order as handed over',
        });

        await this.notifyOrderStatusChangeSafe({
            orderId,
            oldStatus: order.status,
            newStatus: OrderStatus.HANDED_OVER,
            buyerId: order.buyerId._id.toString(),
            sellerId: order.sellerId._id.toString(),
            actorName: (order.sellerId as any)?.name,
            productName: (order.productId as any)?.title,
        });

        return updated;
    }

    async completeOrder(userId: string, orderId: string) {
        const order = await this.repository.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.buyerId._id.toString() !== userId) throw new Error('Unauthorized');
        if (![OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.HANDED_OVER].includes(order.status)) {
            throw new Error('Only pending, accepted, or handed over orders can be completed');
        }

        const { completedOrderId, productTitle } = await this.runWithOptionalTransaction(async (session) => {
            const productQuery = ProductModel.findById(order.productId);
            if (session) {
                productQuery.session(session);
            }

            const product = await productQuery;
            let txProductTitle: string | undefined;

            if (product) {
                if ((product.quantity ?? 0) < (order.quantity ?? 1)) {
                    throw new Error(`Only ${product.quantity ?? 0} items available in stock.`);
                }

                const nextQuantity = Math.max(0, (product.quantity ?? 0) - (order.quantity ?? 1));
                product.quantity = nextQuantity;
                product.status = nextQuantity > 0 ? 'available' : 'sold';
                if (session) {
                    await product.save({ session });
                } else {
                    await product.save();
                }
                txProductTitle = product.title;
            }

            const updated = await OrderModel.findOneAndUpdate(
                {
                    _id: orderId,
                    buyerId: userId as any,
                    status: { $in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.HANDED_OVER] },
                },
                {
                    $set: {
                        status: OrderStatus.COMPLETED,
                        completedAt: new Date(),
                    },
                    $push: {
                        statusHistory: this.buildStatusAuditEntry({
                            status: OrderStatus.COMPLETED,
                            changedBy: userId,
                            note: 'Buyer confirmed receipt and marked order completed',
                        })
                    }
                },
                {
                    new: true,
                    ...(session ? { session } : {}),
                }
            );

            if (!updated) {
                throw new Error('Only pending, accepted, or handed over orders can be completed');
            }

            return {
                completedOrderId: updated._id.toString(),
                productTitle: txProductTitle,
            };
        });

        const updatedOrder = await this.repository.findById(completedOrderId || orderId);

        await this.notifyOrderStatusChangeSafe({
            orderId,
            oldStatus: order.status,
            newStatus: OrderStatus.COMPLETED,
            buyerId: order.buyerId._id.toString(),
            sellerId: order.sellerId._id.toString(),
            actorName: (order.buyerId as any)?.name,
            productName: productTitle || (order.productId as any)?.title,
        });

        try {
            await this.notificationService.notifyOrderCompleted({
                sellerId: order.sellerId._id.toString(),
                buyerName: (order.buyerId as any)?.name?.toString?.() || 'Buyer',
                orderId: order._id.toString(),
                productName: productTitle,
            });

            const sellerName = (order.sellerId as any)?.name?.toString?.() || 'User';
            const soldProductTitle = productTitle || (order.productId as any)?.title || 'your product';
            await this.notificationService.notifyProductSold(
                order.sellerId._id.toString(),
                sellerName,
                order.productId._id?.toString?.() || order.productId.toString(),
                soldProductTitle
            );
        } catch (error: any) {
            await this.appendAuditEntry({
                orderId,
                status: OrderStatus.COMPLETED,
                actorUserId: userId,
                note: 'Order completed, but seller notification failed',
                metadata: {
                    error: error?.message || 'Unknown notification error',
                },
            });
        }

        return updatedOrder;
    }

    async cancelOrder(userId: string, orderId: string) {
        const order = await this.repository.findById(orderId);
        if (!order) throw new Error('Order not found');

        const isBuyer = order.buyerId._id.toString() === userId;
        const isSeller = order.sellerId._id.toString() === userId;

        if (!isBuyer && !isSeller) throw new Error('Unauthorized');
        if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
            throw new Error('Order cannot be cancelled in current status');
        }

        // If order was accepted/reserved, release the product
        if (order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.HANDED_OVER) {
            const product = await ProductModel.findById(order.productId);
            if (product && product.status === 'reserved') {
                product.status = 'available';
                await product.save();
            }
        }

        const nextStatus = OrderStatus.CANCELLED;
        const updated = await this.updateStatusWithAudit({
            orderId,
            status: nextStatus,
            actorUserId: userId,
            note: isBuyer ? 'Buyer cancelled order' : 'Seller cancelled order',
        });

        await this.notifyOrderStatusChangeSafe({
            orderId,
            oldStatus: order.status,
            newStatus: nextStatus,
            buyerId: order.buyerId._id.toString(),
            sellerId: order.sellerId._id.toString(),
            actorName: isBuyer ? (order.buyerId as any)?.name : (order.sellerId as any)?.name,
            productName: (order.productId as any)?.title,
        });

        return updated;
    }

    async openDispute(userId: string, orderId: string) {
        const order = await this.repository.findById(orderId);
        if (!order) throw new Error('Order not found');

        if (order.buyerId._id.toString() !== userId && order.sellerId._id.toString() !== userId) {
            throw new Error('Unauthorized');
        }

        const updated = await this.updateStatusWithAudit({
            orderId,
            status: OrderStatus.DISPUTED,
            actorUserId: userId,
            note: 'Dispute opened by user',
        });

        await this.notifyOrderStatusChangeSafe({
            orderId,
            oldStatus: order.status,
            newStatus: OrderStatus.DISPUTED,
            buyerId: order.buyerId._id.toString(),
            sellerId: order.sellerId._id.toString(),
            actorName: order.buyerId._id.toString() === userId ? (order.buyerId as any)?.name : (order.sellerId as any)?.name,
            productName: (order.productId as any)?.title,
        });

        return updated;
    }

    async getAllOrders(page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.repository.findAll({}, skip, limit);
    }

    async resolveDispute(orderId: string, resolutionStatus: OrderStatus) {
        const order = await this.repository.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.status !== OrderStatus.DISPUTED) throw new Error('Order is not in dispute');

        // If resolving as cancelled, release product if reserved
        if (resolutionStatus === OrderStatus.CANCELLED) {
            const product = await ProductModel.findById(order.productId);
            if (product && product.status === 'reserved') {
                product.status = 'available';
                await product.save();
            }
        } else if (resolutionStatus === OrderStatus.COMPLETED) {
            const product = await ProductModel.findById(order.productId);
            if (product) {
                if ((product.quantity ?? 0) < (order.quantity ?? 1)) {
                    throw new Error(`Only ${product.quantity ?? 0} items available in stock.`);
                }
                const nextQuantity = Math.max(0, (product.quantity ?? 0) - (order.quantity ?? 1));
                product.quantity = nextQuantity;
                product.status = nextQuantity > 0 ? 'available' : 'sold';
                await product.save();

                const sellerName = (order.sellerId as any)?.name?.toString?.() || 'User';
                await this.notificationService.notifyProductSold(
                    order.sellerId._id.toString(),
                    sellerName,
                    product._id.toString(),
                    product.title
                );
            }
        }

        const updated = await this.updateStatusWithAudit({
            orderId,
            status: resolutionStatus,
            note: 'Admin resolved dispute',
            additionalSet: resolutionStatus === OrderStatus.COMPLETED ? { completedAt: new Date() } : {},
        });

        await this.notifyOrderStatusChangeSafe({
            orderId,
            oldStatus: order.status,
            newStatus: resolutionStatus,
            buyerId: order.buyerId._id.toString(),
            sellerId: order.sellerId._id.toString(),
            actorName: 'Admin',
            productName: (order.productId as any)?.title,
        });

        return updated;
    }

    async getSellerMetrics(userId: string) {
        const rows = await OrderModel.aggregate<{
            _id: string;
            count: number;
            revenue: number;
        }>([
            { $match: { sellerId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', OrderStatus.COMPLETED] },
                                { $multiply: ['$price', { $ifNull: ['$quantity', 1] }] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const orderStatusStats: Record<string, number> = {};
        let totalRevenue = 0;
        let completedOrders = 0;
        let pendingOrders = 0;
        let totalSales = 0;

        for (const row of rows) {
            orderStatusStats[row._id] = row.count;
            totalSales += row.count;
            totalRevenue += Number(row.revenue || 0);

            if (row._id === OrderStatus.COMPLETED) {
                completedOrders += row.count;
            }

            if ([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.HANDED_OVER, OrderStatus.DISPUTED].includes(row._id as OrderStatus)) {
                pendingOrders += row.count;
            }
        }

        return {
            totalRevenue,
            pendingOrders,
            completedOrders,
            totalSales,
            orderStatusStats,
        };
    }
}
