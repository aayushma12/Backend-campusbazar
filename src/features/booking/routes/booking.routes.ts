import { Router } from 'express';
import { authGuard } from '../../../common/middleware/auth.guard';
import { trimBody } from '../../../common/middleware/trim-body.middleware';
import {
    createBooking,
    getMyBookings,
    getBooking,
    initiatePayment,
    confirmPayment,
    cancelBooking,
    getWallet,
} from '../controller/booking.controller';

const router = Router();
router.use(authGuard);

// Wallet
/**
 * @swagger
 * /api/v1/bookings/wallet:
 *   get:
 *     tags: [Booking]
 *     summary: Get current user's booking wallet summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet summary returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/wallet', getWallet);

// My bookings (as student or tutor)
/**
 * @swagger
 * /api/v1/bookings/mine:
 *   get:
 *     tags: [Booking]
 *     summary: List bookings for the current user (student and tutor views)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, tutor]
 *         required: false
 *         description: Optionally filter bookings by participation role
 *     responses:
 *       200:
 *         description: Bookings fetched successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/mine', getMyBookings);

// Create a booking
/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     tags: [Booking]
 *     summary: Create a new tutor booking request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId]
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: Tutor request identifier
 *               note:
 *                 type: string
 *               preferredDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', trimBody, createBooking);

// CRUD for a specific booking
/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     tags: [Booking]
 *     summary: Get booking details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     tags: [Booking]
 *     summary: Cancel an existing booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', cancelBooking);

// Payment flow
/**
 * @swagger
 * /api/v1/bookings/{id}/initiate-payment:
 *   get:
 *     tags: [Booking]
 *     summary: Initiate payment for a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment initiation payload generated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/initiate-payment', initiatePayment);

/**
 * @swagger
 * /api/v1/bookings/{id}/confirm-payment:
 *   post:
 *     tags: [Booking]
 *     summary: Confirm booking payment after provider callback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/confirm-payment', trimBody, confirmPayment);

export default router;
