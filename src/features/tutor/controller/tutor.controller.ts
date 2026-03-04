import { Request, Response } from 'express';
import { TutorService } from '../service/tutor.service';

export class TutorController {
    private tutorService: TutorService;

    constructor() {
        this.tutorService = new TutorService();
    }

    createRequest = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { subject, topic, description, preferredTime } = req.body;

            const request = await this.tutorService.createRequest({
                studentId: userId,
                subject,
                topic,
                description,
                preferredTime
            } as any);

            res.status(201).json({
                success: true,
                message: 'Tutor request created successfully',
                data: request
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    };

    getAvailableRequests = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const requests = await this.tutorService.getAvailableRequests(userId);

            res.status(200).json({
                success: true,
                data: requests
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    };

    getMyRequests = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const requests = await this.tutorService.getMyRequests(userId);

            res.status(200).json({
                success: true,
                data: requests
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    };

    acceptRequest = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { requestId } = req.params;

            const result = await this.tutorService.acceptRequest(requestId, userId);

            res.status(200).json({
                success: true,
                message: 'Tutor request accepted successfully',
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    };

    getAcceptedRequests = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const requests = await this.tutorService.getAcceptedRequests(userId);

            res.status(200).json({
                success: true,
                data: requests
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    };
}
