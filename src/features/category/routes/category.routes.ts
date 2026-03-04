
import { Router } from 'express';
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    updateCategory
} from '../controller/category.controller';
import { authGuard } from '../../../common/middleware/auth.guard';
import { adminGuard } from '../../../common/middleware/admin.guard';
import { validateBody } from '../../../features/auth/middleware/validate-body.middleware';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     responses:
 *       200:
 *         description: Array of categories
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /api/v1/categories/admin:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
    '/admin',
    authGuard,
    adminGuard,
    trimBody,
    validateBody(CreateCategoryDto),
    createCategory
);

/**
 * @swagger
 * /api/v1/categories/admin/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category (Admin)
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
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch(
    '/admin/:id',
    authGuard,
    adminGuard,
    trimBody,
    validateBody(UpdateCategoryDto),
    updateCategory
);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
    '/',
    authGuard,
    trimBody,
    validateBody(CreateCategoryDto),
    createCategory
);

/**
 * @swagger
 * /api/v1/categories/admin/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete(
    '/admin/:id',
    authGuard,
    adminGuard,
    deleteCategory
);

export default router;
