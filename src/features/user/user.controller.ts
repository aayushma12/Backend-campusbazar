import { Request, Response } from "express";
import { UserModel } from "../auth/entity/user.model";


export const getAllUsers = async (req: Request, res: Response) => {
    try {
        // Pagination logic
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            UserModel.find().select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
            UserModel.countDocuments()
        ]);

        res.status(200).json({
            success:     true,
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndDelete(id);
        
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed", error });
    }
};