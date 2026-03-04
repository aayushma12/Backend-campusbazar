import { ReportModel, ReportType, ReportStatus } from '../entity/report.model';

export class ReportService {
    async createReport(reporterId: string, targetId: string, targetType: ReportType, reason: string, details?: string) {
        return ReportModel.create({
            reporterId: reporterId as any,
            targetId: targetId as any,
            targetType,
            reason,
            details
        });
    }

    async getMyReports(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [reports, total] = await Promise.all([
            ReportModel.find({ reporterId: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ReportModel.countDocuments({ reporterId: userId })
        ]);
        return { reports, total };
    }
}
