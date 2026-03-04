import { TutorRepository } from '../repository/tutor.repository';
import { ITutorRequest } from '../entity/tutorRequest.model';
import { ChatService } from '../../chat/service/chat.service';
import { NotificationService } from '../../notification/service/notification.service';
import { UserModel } from '../../auth/entity/user.model';

export class TutorService {
    private tutorRepository: TutorRepository;
    private chatService: ChatService;
    private notificationService: NotificationService;

    constructor() {
        this.tutorRepository = new TutorRepository();
        this.chatService = new ChatService();
        this.notificationService = new NotificationService();
    }

    async createRequest(data: Partial<ITutorRequest>): Promise<ITutorRequest> {
        return await this.tutorRepository.create(data);
    }

    async getAvailableRequests(userId: string): Promise<ITutorRequest[]> {
        return await this.tutorRepository.findAllPending(userId);
    }

    async getMyRequests(studentId: string): Promise<ITutorRequest[]> {
        return await this.tutorRepository.findByStudentId(studentId);
    }

    async getAcceptedRequests(tutorId: string): Promise<ITutorRequest[]> {
        return await this.tutorRepository.findByTutorId(tutorId);
    }

    async acceptRequest(requestId: string, tutorId: string): Promise<{ request: ITutorRequest; chat: any }> {
        const request = await this.tutorRepository.findById(requestId);
        if (!request) {
            throw new Error('Tutor request not found');
        }
        if (request.status !== 'pending') {
            throw new Error('Request is no longer available');
        }
        if (request.studentId.toString() === tutorId) {
            throw new Error('You cannot accept your own request');
        }

        const updatedRequest = await this.tutorRepository.acceptPendingRequest(requestId, tutorId);

        if (!updatedRequest) {
            throw new Error('Failed to accept request');
        }

        const chat = await this.chatService.getOrCreateTutorConversation(updatedRequest._id.toString(), tutorId);

        const studentUser = await UserModel.findById(updatedRequest.studentId).select('name');
        const studentName = studentUser?.name?.toString() || 'User';
        await this.notificationService.notifyTutorRequestAccepted(
            updatedRequest.studentId.toString(),
            studentName,
            updatedRequest._id.toString()
        );

        return {
            request: updatedRequest,
            chat
        };
    }
}
