
import { Router } from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    getMyListings,
    updateProduct,
    deleteProduct,
    changeProductStatus
} from '../controller/product.controller';
import { authGuard, optionalAuthGuard } from '../../../common/middleware/auth.guard';
import { upload } from '../../../common/middleware/multer.middleware';
import { validateBody } from '../../../features/auth/middleware/validate-body.middleware';
import { CreateProductDto, UpdateProductDto, ChangeStatusDto } from '../dto/product.dto';
import { adminGuard } from '../../../common/middleware/admin.guard';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: Browse all products
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', optionalAuthGuard, getAllProducts);

/**
 * @swagger
 * /api/v1/products/my-listings:
 *   get:
 *     tags: [Products]
 *     summary: Get listings owned by current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User listings
 */
router.get('/my-listings', authGuard, getMyListings);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product listing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               categoryId: { type: string }
 *               images: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       201:
 *         description: Product created
 */
router.post(
    '/',
    authGuard,
    upload.array('images', 8),
    trimBody,
    createProduct
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update an existing product listing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               images: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch(
    '/:id',
    authGuard,
    upload.array('images', 8),
    trimBody,
    updateProduct
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete a product listing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', authGuard, deleteProduct);

/**
 * @swagger
 * /api/v1/products/{id}/status:
 *   patch:
 *     tags: [Products]
 *     summary: Change product status (e.g., mark as sold)
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
 *               status: { type: string, enum: [available, reserved, sold] }
 *     responses:
 *       200:
 *         description: Product status updated
 */
router.patch(
    '/:id/status',
    authGuard,
    trimBody,
    validateBody(ChangeStatusDto),
    changeProductStatus
);

export default router;
