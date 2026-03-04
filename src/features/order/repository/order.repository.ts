import { OrderModel, IOrder, OrderStatus } from '../entity/order.model';

export class OrderRepository {
    async create(data: Partial<IOrder>): Promise<IOrder> {
        return OrderModel.create(data);
    }

    async findById(id: string): Promise<IOrder | null> {
        return OrderModel.findById(id)
            .populate('productId', 'title price images status')
            .populate('buyerId', 'name email profilePicture')
            .populate('sellerId', 'name email profilePicture');
    }

    async findByIdForUser(id: string, userId: string): Promise<IOrder | null> {
        return OrderModel.findOne({
            _id: id,
            $or: [{ buyerId: userId as any }, { sellerId: userId as any }],
        })
            .populate('productId', 'title price images status')
            .populate('buyerId', 'name email profilePicture')
            .populate('sellerId', 'name email profilePicture');
    }

    async findAll(query: any, skip: number, limit: number): Promise<{ orders: IOrder[], total: number }> {
        const [orders, total] = await Promise.all([
            OrderModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('productId', 'title price images')
                .populate('buyerId', 'name')
                .populate('sellerId', 'name'),
            OrderModel.countDocuments(query)
        ]);
        return { orders, total };
    }

    async update(id: string, data: Record<string, unknown>): Promise<IOrder | null> {
        const hasMongoOperator = Object.keys(data).some((key) => key.startsWith('$'));
        const updatePayload = hasMongoOperator ? data : { $set: data };

        return OrderModel.findByIdAndUpdate(id, updatePayload, { new: true })
            .populate('productId', 'title price images')
            .populate('buyerId', 'name')
            .populate('sellerId', 'name');
    }
}
