import { Router } from 'express';
import { TutorController } from '../controller/tutor.controller';
import { authGuard } from '../../../common/middleware/auth.guard';

const router = Router();
const tutorController = new TutorController();

/**
 * @swagger
 * /api/v1/tutor/request:
 *   post:
 *     tags: [Tutor]
 *     summary: Create a tutor request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, budget, availability]
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: number
 *               availability:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tutor request created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/request', authGuard, tutorController.createRequest);

/**
 * @swagger
 * /api/v1/tutor/available:
 *   get:
 *     tags: [Tutor]
 *     summary: List available tutor requests to accept
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available tutor requests returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/available', authGuard, tutorController.getAvailableRequests);

/**
 * @swagger
 * /api/v1/tutor/my-requests:
 *   get:
 *     tags: [Tutor]
 *     summary: List tutor requests created by current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My tutor requests returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-requests', authGuard, tutorController.getMyRequests);

/**
 * @swagger
 * /api/v1/tutor/accepted-requests:
 *   get:
 *     tags: [Tutor]
 *     summary: List tutor requests accepted by current tutor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accepted tutor requests returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/accepted-requests', authGuard, tutorController.getAcceptedRequests);

/**
 * @swagger
 * /api/v1/tutor/accept/{requestId}:
 *   post:
 *     tags: [Tutor]
 *     summary: Accept a tutor request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutor request accepted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/accept/:requestId', authGuard, tutorController.acceptRequest);

export default router;
