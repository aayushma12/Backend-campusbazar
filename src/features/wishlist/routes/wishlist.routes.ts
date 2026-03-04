
import { Router } from 'express';
import { addToWishlist, removeFromWishlist, getWishlist } from '../controller/wishlist.controller';
import { authGuard } from '../../../common/middleware/auth.guard';

const router = Router();

// All wishlist routes are protected
router.use(authGuard);

/**
 * @swagger
 * /api/v1/wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get current user's wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of wishlist items
 */
router.get('/', getWishlist);

/**
 * @swagger
 * /api/v1/wishlist/{productId}:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add a product to wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Added to wishlist
 */
router.post('/:productId', addToWishlist);

/**
 * @swagger
 * /api/v1/wishlist/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove a product from wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed from wishlist
 */
router.delete('/:productId', removeFromWishlist);

export default router;
