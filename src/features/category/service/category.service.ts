
import mongoose from 'mongoose';
import { CategoryRepository } from '../repository/category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { ProductModel } from '../../product/entity/product.model';
import { CategoryModel } from '../entity/category.model'; // For children check

export class CategoryService {
    private repository = new CategoryRepository();

    async create(dto: CreateCategoryDto) {
        // Generate slug if not provided
        if (!dto.slug) {
            dto.slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        // Check if slug exists
        const existing = await this.repository.findBySlug(dto.slug);
        if (existing) {
            // If it already exists, just return it (makes it idempotent for user-generated tags)
            return existing;
        }

        return this.repository.create(dto as any);
    }

    async findAll() {
        return this.repository.findAll();
    }

    async findById(id: string) {
        if (mongoose.Types.ObjectId.isValid(id)) {
            return this.repository.findById(id);
        }
        return this.repository.findBySlug(id);
    }

    async update(id: string, dto: UpdateCategoryDto) {
        const category = await this.repository.findById(id);
        if (!category) throw new Error('Category not found');

        // Check if updating slug to existing one
        if (dto.slug && dto.slug !== category.slug) {
            const existing = await this.repository.findBySlug(dto.slug);
            if (existing) throw new Error('Slug already in use');
        }

        return this.repository.update(id, dto as any);
    }

    async delete(id: string) {
        // 1. Check for products using this category
        const productCount = await ProductModel.countDocuments({ categoryId: id });
        if (productCount > 0) {
            throw new Error('Cannot delete category with associated products');
        }

        // 2. Check for subcategories
        const childrenCount = await CategoryModel.countDocuments({ parentId: id });
        if (childrenCount > 0) {
            throw new Error('Cannot delete category with subcategories');
        }

        return this.repository.delete(id);
    }
}
