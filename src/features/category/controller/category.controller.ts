
import { Request, Response } from 'express';
import { CategoryService } from '../service/category.service';

const service = new CategoryService();

export const createCategory = async (req: Request, res: Response) => {
    try {
        const category = await service.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await service.findAll();
        res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await service.update(id, req.body);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.status(200).json({ success: true, data: category });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await service.delete(id);
        if (!result) return res.status(404).json({ success: false, message: 'Category not found' });
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
