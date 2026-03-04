import { Router } from 'express';
import {
    reportListing,
    reportUser,
    reportMessage,
    getMyReports
} from '../controller/report.controller';
import { authGuard } from '../../../common/middleware/auth.guard';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

router.use(authGuard);

/**
 * @swagger
 * /api/v1/reports/my-reports:
 *   get:
 *     tags: [Reporting]
 *     summary: Get reports submitted by current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's reports
 */
router.get('/my-reports', getMyReports);

/**
 * @swagger
 * /api/v1/reports/listings/{id}:
 *   post:
 *     tags: [Reporting]
 *     summary: Report a product listing
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
 *               reason: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post('/listings/:id', trimBody, reportListing);

/**
 * @swagger
 * /api/v1/reports/users/{id}:
 *   post:
 *     tags: [Reporting]
 *     summary: Report a user
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
 *               reason: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post('/users/:id', trimBody, reportUser);

/**
 * @swagger
 * /api/v1/reports/messages/{id}:
 *   post:
 *     tags: [Reporting]
 *     summary: Report a specific chat message
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
 *               reason: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post('/messages/:id', trimBody, reportMessage);

export default router;
