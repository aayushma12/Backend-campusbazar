import { CartItemModel, ICartItem } from '../entity/cart.model';

export class CartRepository {
    async findByUser(userId: string): Promise<ICartItem[]> {
        return CartItemModel.find({ userId })
            .populate('productId', 'title price images campus ownerId quantity status')
            .sort({ createdAt: -1 });
    }

    async findOne(userId: string, productId: string): Promise<ICartItem | null> {
        return CartItemModel.findOne({ userId, productId });
    }

    async create(data: Partial<ICartItem>): Promise<ICartItem> {
        return CartItemModel.create(data);
    }

    async updateQuantity(id: string, quantity: number): Promise<ICartItem | null> {
        return CartItemModel.findByIdAndUpdate(id, { quantity }, { new: true })
            .populate('productId', 'title price images campus ownerId quantity status');
    }

    async remove(id: string): Promise<ICartItem | null> {
        return CartItemModel.findByIdAndDelete(id);
    }

    async clear(userId: string): Promise<any> {
        return CartItemModel.deleteMany({ userId });
    }
}
