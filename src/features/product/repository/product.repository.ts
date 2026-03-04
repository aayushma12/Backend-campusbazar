
import mongoose from 'mongoose';
import { ProductModel, IProduct } from '../entity/product.model';
import { IProductRepository } from './product.repository.interface';

export class ProductRepository implements IProductRepository {
    async create(data: Partial<IProduct>): Promise<IProduct> {
        return ProductModel.create(data);
    }

    async findById(id: string): Promise<IProduct | null> {
        return ProductModel.findById(id).populate('ownerId', 'name email profilePicture').populate('categoryId', 'name slug');
    }

    async findAll(query: any, skip: number, limit: number, sort: any): Promise<{ products: IProduct[], total: number }> {
        const [products, total] = await Promise.all([
            ProductModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('ownerId', 'name email profilePicture')
                .populate('categoryId', 'name slug'),
            ProductModel.countDocuments(query)
        ]);
        return { products, total };
    }

    async findByOwner(ownerId: string, skip: number, limit: number): Promise<{ products: IProduct[], total: number }> {
        const query = { ownerId, status: { $ne: 'deleted' } };
        const [products, total] = await Promise.all([
            ProductModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('categoryId', 'name slug'),
            ProductModel.countDocuments(query)
        ]);
        return { products, total };
    }

    async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
        return ProductModel.findByIdAndUpdate(id, data, { new: true }).populate('ownerId', 'name email profilePicture').populate('categoryId', 'name slug');
    }

    async delete(id: string): Promise<IProduct | null> {
        // Soft delete
        return ProductModel.findByIdAndUpdate(id, { status: 'deleted' }, { new: true });
    }
}
