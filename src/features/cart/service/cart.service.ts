import { CartRepository } from '../repository/cart.repository';
import { ProductModel } from '../../product/entity/product.model';

export class CartService {
    private repository = new CartRepository();

    private toValidQuantity(value: unknown, fallback = 1) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(1, Math.floor(parsed));
    }

    async getCart(userId: string) {
        return this.repository.findByUser(userId);
    }

    async addToCart(userId: string, productId: string, quantity: number = 1) {
        const requestedQuantity = this.toValidQuantity(quantity, 1);

        // Validate product exists
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');
        if (product.status !== 'available') throw new Error('Product is not available');
        if ((product.quantity ?? 0) <= 0) throw new Error('Out of stock');
        if (product.ownerId.toString() === userId) throw new Error('You cannot add your own product to cart');

        // Check if already in cart
        const existing = await this.repository.findOne(userId, productId);
        if (existing) {
            const nextQuantity = existing.quantity + requestedQuantity;
            if (nextQuantity > (product.quantity ?? 0)) {
                throw new Error(`Only ${product.quantity} items available in stock.`);
            }
            return this.repository.updateQuantity(existing.id, nextQuantity);
        }

        if (requestedQuantity > (product.quantity ?? 0)) {
            throw new Error(`Only ${product.quantity} items available in stock.`);
        }

        return this.repository.create({ userId: userId as any, productId: productId as any, quantity: requestedQuantity });
    }

    async updateQuantity(userId: string, cartItemId: string, quantity: number) {
        const requestedQuantity = this.toValidQuantity(quantity, 1);

        // Security check: ensure item belongs to user
        const cartItems = await this.repository.findByUser(userId);
        const item = cartItems.find(i => i.id === cartItemId);
        if (!item) throw new Error('Cart item not found');

        const productId = (item as any).productId?._id?.toString?.() || (item as any).productId?.toString?.();
        if (!productId) throw new Error('Product not found');

        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');
        if (product.status !== 'available') throw new Error('Product is not available');
        if ((product.quantity ?? 0) <= 0) throw new Error('Out of stock');

        if (requestedQuantity > (product.quantity ?? 0)) {
            throw new Error(`Only ${product.quantity} items available in stock.`);
        }

        return this.repository.updateQuantity(cartItemId, requestedQuantity);
    }

    async removeFromCart(userId: string, cartItemId: string) {
        // Security check: ensure item belongs to user
        const cartItems = await this.repository.findByUser(userId);
        const item = cartItems.find(i => i.id === cartItemId);
        if (!item) throw new Error('Cart item not found');

        return this.repository.remove(cartItemId);
    }

    async clearCart(userId: string) {
        return this.repository.clear(userId);
    }
}
