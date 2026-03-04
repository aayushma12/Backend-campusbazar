
import { Request, Response } from 'express';
import { UserModel } from '../../auth/entity/user.model';
import { ProductModel } from '../../product/entity/product.model';
import { OrderModel } from '../../order/entity/order.model';
import { ReportModel, ReportStatus } from '../../report/entity/report.model';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const [userCount, productCount, orderCount, reportCount, pendingReports] = await Promise.all([
            UserModel.countDocuments(),
            ProductModel.countDocuments({ status: { $ne: 'deleted' } }),
            OrderModel.countDocuments(),
            ReportModel.countDocuments(),
            ReportModel.countDocuments({ status: 'pending' })
        ]);

        // Get last 7 days orders for a simple sparkline/trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentOrders = await OrderModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        res.status(200).json({
            success: true,
            data: {
                users: userCount,
                listings: productCount,
                orders: orderCount,
                reports: reportCount,
                pendingReports,
                recentOrdersTrend: recentOrders
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminGetAllUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const search = (req.query.search as string) || '';
        const role = (req.query.role as string) || '';
        const status = (req.query.status as string) || '';

        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (status) query.status = status;

        const [users, total] = await Promise.all([
            UserModel.find(query).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
            UserModel.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminUpdateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body; // status, role, isVerified

        const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminGetAllProducts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.search) {
            query.title = { $regex: req.query.search, $options: 'i' };
        }

        const [products, total] = await Promise.all([
            ProductModel.find(query).populate('ownerId', 'name email').skip(skip).limit(limit).sort({ createdAt: -1 }),
            ProductModel.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminUpdateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body; // title, description, price, status, etc.

        const product = await ProductModel.findByIdAndUpdate(id, updates, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({ success: true, data: product });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminGetAllReports = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.type) query.targetType = req.query.type;

        const [reports, total] = await Promise.all([
            ReportModel.find(query)
                .populate('reporterId', 'name email')
                .populate('resolvedById', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            ReportModel.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: reports,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminResolveReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action, notes } = req.body;
        const adminId = (req as any).user.id;

        const validActions = [
            ReportStatus.RESOLVED,
            ReportStatus.DISMISSED,
            ReportStatus.IGNORED,
            ReportStatus.REMOVED,
            ReportStatus.WARNED
        ];

        if (!validActions.includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid resolution action" });
        }

        const report = await ReportModel.findByIdAndUpdate(id, {
            status: action,
            resolutionNotes: notes,
            resolvedById: adminId
        }, { new: true });

        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        res.status(200).json({ success: true, data: report });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminDeleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminDeleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findByIdAndUpdate(id, { status: 'deleted' }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
