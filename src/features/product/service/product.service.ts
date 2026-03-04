
import mongoose from 'mongoose';
import { ProductRepository } from '../repository/product.repository';
import { CreateProductDto, UpdateProductDto, ProductStatus, ProductCondition } from '../dto/product.dto';
import { uploadToCloudinary, extractPublicId, deleteFromCloudinary } from '../../../common/utils/cloudinary.helper';
import { CategoryModel } from '../../category/entity/category.model';
import { IProduct } from '../entity/product.model';
import { NotificationService } from '../../notification/service/notification.service';

export class ProductService {
    private repository = new ProductRepository();
    private notificationService = new NotificationService();

    private getOwnerIdString(ownerRef: any): string {
        if (!ownerRef) return '';
        if (typeof ownerRef === 'string') return ownerRef;

        return (
            ownerRef?._id?.toString?.() ||
            ownerRef?.id?.toString?.() ||
            ownerRef?.toString?.() ||
            ''
        );
    }

    private normalizeQuantity(value: unknown, fallback = 0) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(0, Math.floor(parsed));
    }

    async create(userId: string, dto: CreateProductDto, files: Express.Multer.File[]) {
        // Validate category
        let category;
        if (mongoose.Types.ObjectId.isValid(dto.categoryId)) {
            category = await CategoryModel.findById(dto.categoryId);
        } else {
            category = await CategoryModel.findOne({ slug: dto.categoryId });
            if (category) {
                // If found by slug, update the DTO to use the real ID for storage
                dto.categoryId = category._id as any;
            }
        }
        if (!category) throw new Error('Invalid category');

        // Validation for images (min 1) handled in controller but good to double check
        if (!files || files.length === 0) {
            throw new Error('At least one image is required');
        }
        if (files.length > 8) {
            throw new Error('Maximum 8 images allowed');
        }

        // Upload images
        const imageUrls: string[] = [];
        for (const file of files) {
            const result = await uploadToCloudinary(file.buffer, 'campus-bazar/products');
            imageUrls.push(result.secure_url);
        }

        const created = await this.repository.create({
            ...dto,
            quantity: this.normalizeQuantity((dto as any).quantity, 0),
            ownerId: userId as any,
            images: imageUrls,
            status: ProductStatus.AVAILABLE
        } as any);

        await this.notificationService.notifyProductUploaded(
            created._id.toString(),
            created.title,
            userId
        );

        return created;
    }

    async findAll(query: any) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const sort: any = {};
        if (query.sort) {
            const parts = (query.sort as string).split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const filter: any = { status: ProductStatus.AVAILABLE }; // Public browse only shows available by default? 
        // User spec: "filter by category/price/condition/campus/status"
        if (query.status) filter.status = query.status;

        if (query.search) {
            filter.$text = { $search: query.search };
        }
        if (query.category) {
            if (mongoose.Types.ObjectId.isValid(query.category)) {
                filter.categoryId = query.category;
            } else {
                const category = await CategoryModel.findOne({ slug: query.category });
                if (category) filter.categoryId = category._id;
                else filter.categoryId = new mongoose.Types.ObjectId(); // No results
            }
        }
        if (query.campus) filter.campus = query.campus;
        if (query.condition) filter.condition = query.condition;

        if (query.minPrice || query.maxPrice) {
            filter.price = {};
            if (query.minPrice) filter.price.$gte = Number(query.minPrice);
            if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
        }

        return this.repository.findAll(filter, skip, limit, sort);
    }

    async findById(id: string) {
        const product = await this.repository.findById(id);
        if (!product) throw new Error('Product not found');

        // Increment views
        product.views += 1;
        await product.save();

        return product;
    }

    async findMyListings(userId: string, query: any) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const skip = (page - 1) * limit;
        return this.repository.findByOwner(userId, skip, limit);
    }

    async update(userId: string, id: string, dto: UpdateProductDto) {
        const product = await this.repository.findById(id);
        if (!product) throw new Error('Product not found');

        if (this.getOwnerIdString(product.ownerId) !== userId) {
            throw new Error('Unauthorized to update this product');
        }

        if (product.status !== ProductStatus.AVAILABLE) {
            throw new Error('Cannot update product that is not available');
        }

        // Validate category if changing
        if (dto.categoryId) {
            let category;
            if (mongoose.Types.ObjectId.isValid(dto.categoryId)) {
                category = await CategoryModel.findById(dto.categoryId);
            } else {
                category = await CategoryModel.findOne({ slug: dto.categoryId });
                if (category) {
                    dto.categoryId = category._id as any;
                }
            }
            if (!category) throw new Error('Invalid category');
        }

        if ((dto as any).quantity !== undefined) {
            (dto as any).quantity = this.normalizeQuantity((dto as any).quantity, product.quantity ?? 0);
        }

        const updated = await this.repository.update(id, dto as any);
        if (updated) {
            await this.notificationService.notifyProductUpdated({
                ownerId: product.ownerId._id?.toString?.() || product.ownerId.toString(),
                productId: product._id.toString(),
                productName: updated.title,
            });
        }

        return updated;
    }

    async changeStatus(userId: string, id: string, status: ProductStatus, isAdmin: boolean) {
        const product = await this.repository.findById(id);
        if (!product) throw new Error('Product not found');

        if (!isAdmin && this.getOwnerIdString(product.ownerId) !== userId) {
            throw new Error('Unauthorized to change status');
        }

        // Logic for status transitions
        if (!isAdmin) {
            // Owner restrictions
            if (product.status === ProductStatus.DELETED) throw new Error('Cannot change status of deleted product');
            // Validate valid transitions if needed, but user just said "available->reserved->sold"
        }

        const updated = await this.repository.update(id, { status });

        if (updated && status === ProductStatus.SOLD) {
            const ownerName = (product.ownerId as any)?.name?.toString?.() || 'User';
            await this.notificationService.notifyProductSold(
                product.ownerId._id?.toString?.() || product.ownerId.toString(),
                ownerName,
                product._id.toString(),
                updated.title
            );
        }

        return updated;
    }

    async delete(userId: string, id: string, isAdmin: boolean) {
        const product = await this.repository.findById(id);
        if (!product) throw new Error('Product not found');

        if (!isAdmin && this.getOwnerIdString(product.ownerId) !== userId) {
            throw new Error('Unauthorized to delete this product');
        }

        const deleted = await this.repository.delete(id);

        await this.notificationService.notifyProductDeleted({
            ownerId: product.ownerId._id?.toString?.() || product.ownerId.toString(),
            productId: product._id.toString(),
            productName: product.title,
            deletedBy: isAdmin ? 'admin' : 'owner',
        });

        return deleted;
    }
}
