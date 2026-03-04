
import { WishlistRepository } from '../repository/wishlist.repository';
import { ProductModel } from '../../product/entity/product.model';

export class WishlistService {
    private repository = new WishlistRepository();

    async addToWishlist(userId: string, productId: string) {
        // Validate product exists
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');

        // Check if already in wishlist
        const exists = await this.repository.exists(userId, productId);
        if (exists) return { message: 'Product already in wishlist' };

        return this.repository.create(userId, productId);
    }

    async removeFromWishlist(userId: string, productId: string) {
        return this.repository.delete(userId, productId);
    }

    async getWishlist(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.repository.findByUserId(userId, skip, limit);
    }
}
