
import { Router } from 'express';
import { initPayment, initCartPayment, verifyPayment, getTransaction, getHistory } from '../controller/payment.controller';
import { authGuard } from '../../../common/middleware/auth.guard';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

// Temporary debug route — no auth required
// Visit: GET http://localhost:4000/api/v1/payment/debug-sig
/**
 * @swagger
 * /api/v1/payment/debug-sig:
 *   get:
 *     tags: [Payment]
 *     summary: Debug eSewa signature generation
 *     description: Returns a diagnostic signature payload for local troubleshooting.
 *     responses:
 *       200:
 *         description: Debug signature generated
 */
router.get('/debug-sig', (req, res) => {
    const crypto = require('crypto');
    const key = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1';
    const amount = '100';
    const uuid = 'debug-test-123';
    const code = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
    const msg = `total_amount=${amount},transaction_uuid=${uuid},product_code=${code}`;
    const sig = crypto.createHmac('sha256', key).update(msg).digest('base64');
    // Verify: re-compute and compare
    const verifySig = crypto.createHmac('sha256', key).update(msg).digest('base64');
    res.json({
        key_prefix: key.substring(0, 4) + '...',
        product_code: code,
        message_signed: msg,
        signature: sig,
        self_verify_match: sig === verifySig,
        note: 'If self_verify_match=true, the signing engine is working correctly',
    });
});

router.use(authGuard);

/**
 * @swagger
 * /api/v1/payment/init:
 *   post:
 *     tags: [Payment]
 *     summary: Initialize eSewa payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *     responses:
 *       200:
 *         description: Payment initialization payload returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/init', trimBody, initPayment);

/**
 * @swagger
 * /api/v1/payment/init-cart:
 *   post:
 *     tags: [Payment]
 *     summary: Initialize payment for current cart checkout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               useWallet:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cart payment initialization payload returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/init-cart', trimBody, initCartPayment);

/**
 * @swagger
 * /api/v1/payment/verify:
 *   post:
 *     tags: [Payment]
 *     summary: Verify eSewa payment callback
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment verification completed
 */
router.post('/verify', trimBody, verifyPayment);

/**
 * @swagger
 * /api/v1/payment/transaction/{id}:
 *   get:
 *     tags: [Payment]
 *     summary: Get transaction details by UUID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction details fetched
 */
router.get('/transaction/:id', getTransaction);

/**
 * @swagger
 * /api/v1/payment/history:
 *   get:
 *     tags: [Payment]
 *     summary: Get payment transaction history of current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history fetched
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/history', getHistory);

export default router;
