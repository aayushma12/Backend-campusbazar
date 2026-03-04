import { Router } from 'express';
import { authGuard } from '../../../common/middleware/auth.guard';
import {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
} from '../controller/cart.controller';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

router.use(authGuard);

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's shopping cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cart items
 */
router.get('/', getCart);

/**
 * @swagger
 * /api/v1/cart:
 *   post:
 *     tags: [Cart]
 *     summary: Add product to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: number, default: 1 }
 *     responses:
 *       201:
 *         description: Item added
 */
router.post('/', trimBody, addToCart);

/**
 * @swagger
 * /api/v1/cart/{id}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update quantity of a cart item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: number }
 *     responses:
 *       200:
 *         description: Quantity updated
 */
router.patch('/:id', trimBody, updateQuantity);

/**
 * @swagger
 * /api/v1/cart/{id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/:id', removeFromCart);

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', clearCart);

export default router;
