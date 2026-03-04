import { Router } from 'express';
import {
    startConversation,
    startTutorConversation,
    getMyConversations,
    getMessages,
    sendMessage,
    markRead
} from '../controller/chat.controller';
import { authGuard } from '../../../common/middleware/auth.guard';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

router.use(authGuard);

/**
 * @swagger
 * /api/v1/chats:
 *   post:
 *     tags: [Chat]
 *     summary: Start or get an existing conversation for a product
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
 *     responses:
 *       200:
 *         description: Conversation details
 */
router.post('/', trimBody, startConversation);

/**
 * @swagger
 * /api/v1/chats/tutor/{requestId}:
 *   post:
 *     tags: [Chat]
 *     summary: Start or get accepted tutor-request conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Conversation details
 */
router.post('/tutor/:requestId', startTutorConversation);

/**
 * @swagger
 * /api/v1/chats:
 *   get:
 *     tags: [Chat]
 *     summary: Get all conversations for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations with last message and unread count
 */
router.get('/', getMyConversations);

/**
 * @swagger
 * /api/v1/chats/{id}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get messages for a specific conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Paginated messages
 */
router.get('/:id/messages', getMessages);

/**
 * @swagger
 * /api/v1/chats/{id}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Send a text message
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
 *               text: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/:id/messages', trimBody, sendMessage);

/**
 * @swagger
 * /api/v1/chats/{id}/messages/read:
 *   patch:
 *     tags: [Chat]
 *     summary: Mark messages in conversation as read
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
router.patch('/:id/messages/read', markRead);

export default router;
