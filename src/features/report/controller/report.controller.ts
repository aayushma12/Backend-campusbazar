import { Request, Response } from 'express';
import { ReportService } from '../service/report.service';
import { ReportType } from '../entity/report.model';

const reportService = new ReportService();

export const reportListing = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: listingId } = req.params;
        const { reason, description } = req.body;

        if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

        const report = await reportService.createReport(userId, listingId, ReportType.PRODUCT, reason, description);
        res.status(201).json({ success: true, data: report });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reportUser = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: targetUserId } = req.params;
        const { reason, description } = req.body;

        if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

        const report = await reportService.createReport(userId, targetUserId, ReportType.USER, reason, description);
        res.status(201).json({ success: true, data: report });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reportMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: messageId } = req.params;
        const { reason, description } = req.body;

        if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

        const report = await reportService.createReport(userId, messageId, ReportType.MESSAGE, reason, description);
        res.status(201).json({ success: true, data: report });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyReports = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await reportService.getMyReports(userId, page, limit);
        res.status(200).json({
            success: true,
            data: result.reports,
            pagination: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
