
import { IProduct } from '../entity/product.model';

export interface IProductRepository {
    create(data: Partial<IProduct>): Promise<IProduct>;
    findById(id: string): Promise<IProduct | null>;
    findAll(query: any, skip: number, limit: number, sort: any): Promise<{ products: IProduct[], total: number }>;
    findByOwner(ownerId: string, skip: number, limit: number): Promise<{ products: IProduct[], total: number }>;
    update(id: string, data: Partial<IProduct>): Promise<IProduct | null>;
    delete(id: string): Promise<IProduct | null>;
}
