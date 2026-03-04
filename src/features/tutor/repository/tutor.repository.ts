import { TutorRequestModel, ITutorRequest } from '../entity/tutorRequest.model';
import { Types } from 'mongoose';

export class TutorRepository {
    async create(data: Partial<ITutorRequest>): Promise<ITutorRequest> {
        return await TutorRequestModel.create(data);
    }

    async findAllPending(userId: string): Promise<ITutorRequest[]> {
        // Find all pending requests NOT created by the current user
        return await TutorRequestModel.find({
            status: 'pending',
            studentId: { $ne: new Types.ObjectId(userId) }
        }).populate('studentId', 'name profilePicture university campus');
    }

    async findById(id: string): Promise<ITutorRequest | null> {
        return await TutorRequestModel.findById(id);
    }

    async update(id: string, data: Partial<ITutorRequest>): Promise<ITutorRequest | null> {
        return await TutorRequestModel.findByIdAndUpdate(id, data, { new: true });
    }

    async acceptPendingRequest(id: string, tutorId: string): Promise<ITutorRequest | null> {
        return TutorRequestModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(id),
                status: 'pending',
                studentId: { $ne: new Types.ObjectId(tutorId) }
            },
            {
                $set: {
                    tutorId: new Types.ObjectId(tutorId),
                    status: 'accepted'
                }
            },
            { new: true }
        );
    }

    async findByStudentId(studentId: string): Promise<ITutorRequest[]> {
        return await TutorRequestModel.find({ studentId: new Types.ObjectId(studentId) })
            .populate('tutorId', 'name profilePicture university campus');
    }

    async findByTutorId(tutorId: string): Promise<ITutorRequest[]> {
        return await TutorRequestModel.find({ tutorId: new Types.ObjectId(tutorId) })
            .populate('studentId', 'name profilePicture university campus');
    }
}
