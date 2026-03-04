import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { version } from '../../package.json';

const port = process.env.PORT || '4000';
const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

const apiDefinition: swaggerJsdoc.Options['definition'] = {
    openapi: '3.0.3',
    info: {
        title: 'Campus Bazar API',
        version,
        description: 'API documentation for Campus Bazar - A campus-based marketplace',
    },
    servers: [
        {
            url: baseUrl,
            description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication and session endpoints' },
        { name: 'Profile', description: 'Current user profile management' },
        { name: 'Products', description: 'Marketplace product listing operations' },
        { name: 'Categories', description: 'Product category operations' },
        { name: 'Wishlist', description: 'Wishlist operations' },
        { name: 'Cart', description: 'Shopping cart operations' },
        { name: 'Orders', description: 'Order lifecycle operations' },
        { name: 'Payment', description: 'Payment and transaction operations' },
        { name: 'Chat', description: 'Chat and conversation operations' },
        { name: 'Reporting', description: 'Reporting and moderation flag operations' },
        { name: 'Notifications', description: 'Notification operations' },
        { name: 'Booking', description: 'Tutor booking and wallet operations' },
        { name: 'Tutor', description: 'Tutor request and acceptance operations' },
        { name: 'Admin', description: 'Administrative operations' },
        { name: 'Users', description: 'Admin user management endpoints' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Provide JWT token in the Authorization header as: Bearer <token>',
            },
        },
        responses: {
            UnauthorizedError: {
                description: 'Authentication is required or token is invalid',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
            ForbiddenError: {
                description: 'Authenticated but not authorized',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
            ValidationError: {
                description: 'Request validation failed',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
            NotFoundError: {
                description: 'Requested resource was not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Validation failed' },
                    errors: {
                        oneOf: [
                            { type: 'array', items: { type: 'object', additionalProperties: true } },
                            { type: 'object', additionalProperties: true },
                        ],
                        nullable: true,
                    },
                },
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Operation completed successfully' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['user', 'admin'] },
                    university: { type: 'string' },
                    campus: { type: 'string' },
                    bio: { type: 'string' },
                    profilePicture: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'suspended', 'banned'] },
                    isVerified: { type: 'boolean' },
                },
            },
            Product: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    negotiable: { type: 'boolean' },
                    condition: { type: 'string', enum: ['new', 'like_new', 'good', 'fair', 'poor'] },
                    campus: { type: 'string' },
                    status: { type: 'string', enum: ['available', 'reserved', 'sold', 'deleted'] },
                    images: { type: 'array', items: { type: 'string' } },
                    ownerId: { $ref: '#/components/schemas/User' },
                    categoryId: { type: 'string' },
                    views: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Category: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    parentId: { type: 'string', nullable: true },
                },
            },
        },
    },
};

const apiFiles = [
    path.resolve(process.cwd(), 'src/features/**/routes/*.ts'),
    path.resolve(process.cwd(), 'src/features/**/user.routes.ts'),
    path.resolve(process.cwd(), 'dist/features/**/routes/*.js'),
    path.resolve(process.cwd(), 'dist/features/**/user.routes.js'),
];

const options: swaggerJsdoc.Options = {
    definition: apiDefinition,
    apis: apiFiles,
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
