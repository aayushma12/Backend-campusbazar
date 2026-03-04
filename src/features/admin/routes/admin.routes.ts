
import { Router } from 'express';
import {
    getDashboardStats,
    adminGetAllUsers,
    adminUpdateUser,
    adminGetAllProducts,
    adminUpdateProduct,
    adminDeleteProduct,
    adminGetAllReports,
    adminResolveReport,
    adminDeleteUser
} from '../controller/admin.controller';
import { authGuard } from '../../../common/middleware/auth.guard';
import { adminGuard } from '../../../common/middleware/admin.guard';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

// Global Admin Protection
router.use(authGuard);
router.use(adminGuard);

/**
 * @swagger
 * /api/v1/admin/dashboard/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get high-level system statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Counts of users, products, orders, etc.
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with filters (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', adminGetAllUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user status or role (Admin Only)
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
 *               status: { type: string, enum: [active, suspended, banned] }
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch('/users/:id', trimBody, adminUpdateUser);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Permanently delete a user (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', adminDeleteUser);

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: List all products including hidden/deleted (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', adminGetAllProducts);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Moderation update of a product (Admin Only)
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
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch('/products/:id', trimBody, adminUpdateProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Force delete a product (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product status set to deleted
 */
router.delete('/products/:id', adminDeleteProduct);

/**
 * @swagger
 * /api/v1/admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: List all moderation reports (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 */
router.get('/reports', adminGetAllReports);

/**
 * @swagger
 * /api/v1/admin/reports/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Resolve or dismiss a report (Admin Only)
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
 *               action: { type: string, enum: [resolved, dismissed, ignored, removed, warned] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Report resolved
 */
router.patch('/reports/:id', trimBody, adminResolveReport);

export default router;
