import crypto from 'crypto';
import { Types } from 'mongoose';
import { BookingModel, IBooking } from '../entity/booking.model';
import { WalletModel } from '../entity/wallet.model';
import { TransactionModel } from '../../payment/entity/transaction.model';
import { ConversationModel } from '../../chat/entity/conversation.model';
import { UserModel } from '../../auth/entity/user.model';

const COMMISSION_RATE = 0.10; // 10% platform cut

// eSewa config (reuse from env)
const SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function generateSignature(totalAmount: string, transactionUuid: string, productCode: string): string {
    const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    return crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64');
}

export class BookingService {

    // ─── Create Booking ───────────────────────────────────────────────────────
    async createBooking(studentId: string, body: {
        tutorId: string;
        subject: string;
        description?: string;
        sessionType: 'online' | 'in-person';
        hours: number;
        ratePerHour: number;
    }) {
        const tutor = await UserModel.findById(body.tutorId);
        if (!tutor) throw new Error('Tutor not found');
        if (tutor.id === studentId) throw new Error('Cannot book yourself');

        const totalAmount = Math.round(body.hours * body.ratePerHour);
        const platformFee = Math.round(totalAmount * COMMISSION_RATE);
        const netToTutor = totalAmount - platformFee;

        const booking = await BookingModel.create({
            studentId,
            tutorId: body.tutorId,
            subject: body.subject,
            description: body.description,
            sessionType: body.sessionType,
            hours: body.hours,
            ratePerHour: body.ratePerHour,
            totalAmount,
            platformFee,
            netToTutor,
            status: 'pending',
        });

        return booking;
    }

    // ─── Initiate Payment for a Booking ──────────────────────────────────────
    async initiatePayment(studentId: string, bookingId: string) {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) throw new Error('Booking not found');
        if (booking.studentId.toString() !== studentId) throw new Error('Unauthorized');
        if (booking.status !== 'pending' && booking.status !== 'awaiting_payment') {
            throw new Error(`Booking is already ${booking.status}`);
        }

        const transactionUuid = `BK-${Date.now()}-${studentId.substring(0, 8)}`;
        const amountStr = booking.totalAmount.toString();
        const signature = generateSignature(amountStr, transactionUuid, PRODUCT_CODE);

        // Create / replace transaction record
        const transaction = await TransactionModel.create({
            buyerId: studentId,
            sellerId: booking.tutorId,
            amount: booking.totalAmount,
            status: 'pending',
            transactionUUID: transactionUuid,
        });

        // Link transaction to booking & mark awaiting_payment
        booking.transactionId = transaction._id as any;
        booking.status = 'awaiting_payment';
        await booking.save();

        console.log(`[BookingService] Initiating payment for booking: ${bookingId}, amount: ${amountStr}`);
        console.log(`[BookingService] Signature data payload: total_amount=${amountStr},transaction_uuid=${transactionUuid},product_code=${PRODUCT_CODE}`);

        return {
            amount: amountStr,
            tax_amount: '0',
            total_amount: amountStr,
            transaction_uuid: transactionUuid,
            product_code: PRODUCT_CODE,
            product_service_charge: '0',
            product_delivery_charge: '0',
            success_url: `${FRONTEND_URL}/payment/success`,
            failure_url: `${FRONTEND_URL}/dashboard/bookings?bookingId=${bookingId}&payment=failed`,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            signature,
        };
    }

    // ─── Confirm Payment (called after eSewa success) ─────────────────────────
    async confirmPayment(studentId: string, payload: {
        transactionCode: string;
        transactionUUID: string;
        amount: string;
        bookingId?: string;
    }) {
        let booking;
        if (payload.bookingId) {
            booking = await BookingModel.findById(payload.bookingId)
                .populate('studentId', 'name email')
                .populate('tutorId', 'name email');

            if (booking && booking.studentId.toString() !== studentId) {
                throw new Error('Unauthorized');
            }
        }

        if (booking && booking.status === 'paid') return { alreadyPaid: true, booking };

        // Find transaction
        console.log(`[BookingService] Confirming payment for booking ${payload.bookingId ?? 'unknown'}, UUID: ${payload.transactionUUID}`);
        const transaction = await TransactionModel.findOne({ transactionUUID: payload.transactionUUID });
        if (!transaction) {
            console.error(`[BookingService] Transaction NOT found for UUID: ${payload.transactionUUID}`);
            throw new Error('Transaction not found');
        }

        // Idempotency guard: repeated callbacks should not perform side-effects twice.
        if (transaction.status === 'done') {
            const settledBooking = booking ?? await BookingModel.findOne({ transactionId: transaction._id })
                .populate('studentId', 'name email')
                .populate('tutorId', 'name email');

            if (!settledBooking) throw new Error('Booking not found for this transaction');
            if (settledBooking.studentId.toString() !== studentId) throw new Error('Unauthorized');

            return { alreadyPaid: true, booking: settledBooking };
        }

        // If booking wasn't found by ID, find it by transaction
        if (!booking) {
            booking = await BookingModel.findOne({ transactionId: transaction._id })
                .populate('studentId', 'name email')
                .populate('tutorId', 'name email');
        }

        if (!booking) throw new Error('Booking not found for this transaction');
        if (booking.studentId.toString() !== studentId) throw new Error('Unauthorized');

        // Amount verification
        const expectedAmount = Number(booking.totalAmount);
        const receivedAmount = Number(payload.amount.replace(/,/g, ''));
        if (expectedAmount !== receivedAmount) {
            console.error(`[BookingService] Amount mismatch! Expected: ${expectedAmount}, Received: ${receivedAmount}`);
            throw new Error(`Amount mismatch: Expected ${expectedAmount}, Received ${receivedAmount}`);
        }

        // Mark transaction done atomically; if this fails to transition from pending,
        // another request already processed this callback.
        const updatedTransaction = await TransactionModel.findOneAndUpdate(
            { _id: transaction._id, status: 'pending' },
            {
                $set: {
                    status: 'done',
                    transactionCode: payload.transactionCode,
                    paidTime: new Date(),
                },
            },
            { new: true }
        );

        if (!updatedTransaction) {
            const settledBooking = await BookingModel.findOne({ transactionId: transaction._id })
                .populate('studentId', 'name email')
                .populate('tutorId', 'name email');

            if (!settledBooking) throw new Error('Booking not found for this transaction');
            if (settledBooking.studentId.toString() !== studentId) throw new Error('Unauthorized');

            return { alreadyPaid: true, booking: settledBooking };
        }

        // Credit tutor wallet (90% after 10% commission)
        await WalletModel.findOneAndUpdate(
            { userId: booking.tutorId },
            {
                $inc: {
                    balance: booking.netToTutor,
                    totalEarned: booking.netToTutor,
                },
            },
            { upsert: true, new: true }
        );

        // Create/find chat conversation between student and tutor
        let conversation = await ConversationModel.findOne({
            buyerId: booking.studentId,
            sellerId: booking.tutorId,
        });
        if (!conversation) {
            conversation = await ConversationModel.create({
                buyerId: booking.studentId,
                sellerId: booking.tutorId,
                unreadBy: [],
            });
        }

        // Mark booking paid and link conversation
        booking.status = 'paid';
        booking.conversationId = conversation._id as any;
        await booking.save();

        return { booking, conversation };
    }

    // ─── Get Booking Details ──────────────────────────────────────────────────
    async getBooking(userId: string, bookingId: string) {
        const booking = await BookingModel.findById(bookingId)
            .populate('studentId', 'name email profilePicture university')
            .populate('tutorId', 'name email profilePicture university bio');

        if (!booking) throw new Error('Booking not found');

        const isStudent = booking.studentId.toString() === userId;
        const isTutor = booking.tutorId.toString() === userId;
        if (!isStudent && !isTutor) throw new Error('Unauthorized');

        return booking;
    }

    // ─── List My Bookings ─────────────────────────────────────────────────────
    async getMyBookings(userId: string, role: 'student' | 'tutor') {
        const filter = role === 'student'
            ? { studentId: userId }
            : { tutorId: userId };

        return BookingModel.find(filter)
            .sort({ createdAt: -1 })
            .populate('studentId', 'name email profilePicture university')
            .populate('tutorId', 'name email profilePicture university bio');
    }

    // ─── Get Wallet ───────────────────────────────────────────────────────────
    async getWallet(userId: string) {
        const tutorObjectId = new Types.ObjectId(userId);

        const [earnedAgg, pendingAgg, existingWallet] = await Promise.all([
            BookingModel.aggregate([
                {
                    $match: {
                        tutorId: tutorObjectId,
                        status: { $in: ['paid', 'completed'] },
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netToTutor' }
                    }
                }
            ]),
            BookingModel.aggregate([
                {
                    $match: {
                        tutorId: tutorObjectId,
                        status: { $in: ['pending', 'awaiting_payment'] },
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netToTutor' }
                    }
                }
            ]),
            WalletModel.findOne({ userId: tutorObjectId }),
        ]);

        const totalEarned = Number(earnedAgg[0]?.total ?? 0);
        const pendingBalance = Number(pendingAgg[0]?.total ?? 0);
        const totalWithdrawn = Number(existingWallet?.totalWithdrawn ?? 0);
        const balance = Math.max(0, totalEarned - totalWithdrawn);

        return WalletModel.findOneAndUpdate(
            { userId: tutorObjectId },
            {
                $set: {
                    balance,
                    pendingBalance,
                    totalEarned,
                    totalWithdrawn,
                }
            },
            { upsert: true, new: true }
        );
    }

    // ─── Cancel Booking ───────────────────────────────────────────────────────
    async cancelBooking(userId: string, bookingId: string) {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) throw new Error('Booking not found');
        if (booking.studentId.toString() !== userId) throw new Error('Unauthorized');
        if (booking.status === 'paid') throw new Error('Cannot cancel a paid booking');

        booking.status = 'cancelled';
        await booking.save();
        return booking;
    }
}
