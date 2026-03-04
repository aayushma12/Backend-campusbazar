
import { CategoryModel, ICategory } from '../entity/category.model';

export class CategoryRepository {
    async create(data: Partial<ICategory>): Promise<ICategory> {
        return CategoryModel.create(data);
    }

    async findAll(): Promise<ICategory[]> {
        return CategoryModel.find().lean();
    }

    async findById(id: string): Promise<ICategory | null> {
        return CategoryModel.findById(id);
    }

    async findBySlug(slug: string): Promise<ICategory | null> {
        return CategoryModel.findOne({ slug });
    }

    async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
        return CategoryModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<ICategory | null> {
        return CategoryModel.findByIdAndDelete(id);
    }
}
