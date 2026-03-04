
import { WishlistModel, IWishlist } from '../entity/wishlist.model';

export class WishlistRepository {
    async create(userId: string, productId: string): Promise<IWishlist> {
        return WishlistModel.create({ userId, productId });
    }

    async delete(userId: string, productId: string): Promise<IWishlist | null> {
        return WishlistModel.findOneAndDelete({ userId, productId });
    }

    async exists(userId: string, productId: string): Promise<boolean> {
        const count = await WishlistModel.countDocuments({ userId, productId });
        return count > 0;
    }

    async findByUserId(userId: string, skip: number, limit: number): Promise<{ items: any[], total: number }> {
        const [items, total] = await Promise.all([
            WishlistModel.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'productId',
                    select: 'title price images condition status categoryId ownerId',
                    populate: [
                        { path: 'categoryId', select: 'name slug' },
                        { path: 'ownerId', select: 'name profilePicture' }
                    ]
                }),
            WishlistModel.countDocuments({ userId })
        ]);
        return { items, total };
    }
}
