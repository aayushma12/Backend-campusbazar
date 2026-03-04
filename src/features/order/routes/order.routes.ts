import { Router } from 'express';
import {
    createOrder,
    createBulkCodOrders,
    getOrders,
    getOrderById,
    getMyPurchases,
    getMySales,
    getMySalesMetrics,
    acceptOrder,
    rejectOrder,
    markHandedOver,
    completeOrder,
    cancelOrder,
    disputedOrder,
    adminGetAllOrders,
    adminResolveDispute
} from '../controller/order.controller';
import { authGuard } from '../../../common/middleware/auth.guard';
import { adminGuard } from '../../../common/middleware/admin.guard';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

// User routes
router.use(authGuard);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order request
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
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Order request created
 */
router.post('/', trimBody, createOrder);

/**
 * @swagger
 * /api/v1/orders/bulk-cod:
 *   post:
 *     tags: [Orders]
 *     summary: Create multiple cash-on-delivery orders from cart items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: number }
 *     responses:
 *       201:
 *         description: Bulk COD orders created
 */
router.post('/bulk-cod', trimBody, createBulkCodOrders);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders visible to current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 */
router.get('/', getOrders);

/**
 * @swagger
 * /api/v1/orders/my-purchases:
 *   get:
 *     tags: [Orders]
 *     summary: Get items current user has requested to buy
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchases
 */
router.get('/my-purchases', getMyPurchases);

/**
 * @swagger
 * /api/v1/orders/my-sales:
 *   get:
 *     tags: [Orders]
 *     summary: Get requests for items current user is selling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/my-sales', getMySales);

/**
 * @swagger
 * /api/v1/orders/my-sales/metrics:
 *   get:
 *     tags: [Orders]
 *     summary: Get sales metrics for current seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales metrics returned
 */
router.get('/my-sales/metrics', getMySalesMetrics);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details returned
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getOrderById);

/**
 * @swagger
 * /api/v1/orders/{id}/accept:
 *   patch:
 *     tags: [Orders]
 *     summary: Seller accepts an order (Reserves product)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order accepted
 */
router.patch('/:id/accept', acceptOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/reject:
 *   patch:
 *     tags: [Orders]
 *     summary: Seller rejects an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Order rejected
 */
router.patch('/:id/reject', trimBody, rejectOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/handed-over:
 *   patch:
 *     tags: [Orders]
 *     summary: Seller marks item as delivered to buyer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/handed-over', markHandedOver);

/**
 * @swagger
 * /api/v1/orders/{id}/complete:
 *   patch:
 *     tags: [Orders]
 *     summary: Buyer confirms receipt (Marks product as Sold)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction completed
 */
router.patch('/:id/complete', completeOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an order (Releases reservation if applicable)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order cancelled
 */
router.patch('/:id/cancel', cancelOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/dispute:
 *   patch:
 *     tags: [Orders]
 *     summary: Open a dispute for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dispute opened
 */
router.patch('/:id/dispute', disputedOrder);

// Admin routes
/**
 * @swagger
 * /api/v1/orders/admin/all:
 *   get:
 *     tags: [Admin]
 *     summary: Get all orders (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders returned
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/admin/all', adminGuard, adminGetAllOrders);

/**
 * @swagger
 * /api/v1/orders/admin/{id}/resolve:
 *   patch:
 *     tags: [Admin]
 *     summary: Resolve order dispute (Admin only)
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
 *               action:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/admin/:id/resolve', adminGuard, trimBody, adminResolveDispute);

export default router;
