import { Request, Response } from 'express';
import { BookingService } from '../service/booking.service';

const svc = new BookingService();

// POST /api/v1/bookings
export const createBooking = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.id;
        const booking = await svc.createBooking(studentId, req.body);
        res.status(201).json({ success: true, data: booking });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

// GET /api/v1/bookings/mine?role=student|tutor
export const getMyBookings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const role = (req.query.role as string) === 'tutor' ? 'tutor' : 'student';
        const bookings = await svc.getMyBookings(userId, role);
        res.json({ success: true, data: bookings });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

// GET /api/v1/bookings/:id
export const getBooking = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const booking = await svc.getBooking(userId, req.params.id);
        res.json({ success: true, data: booking });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

// GET /api/v1/bookings/:id/initiate-payment
export const initiatePayment = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.id;
        const data = await svc.initiatePayment(studentId, req.params.id);
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

// POST /api/v1/bookings/:id/confirm-payment
export const confirmPayment = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.id;
        const result = await svc.confirmPayment(studentId, { ...req.body, bookingId: req.params.id });
        res.json({ success: true, data: result });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

// DELETE /api/v1/bookings/:id
export const cancelBooking = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const booking = await svc.cancelBooking(userId, req.params.id);
        res.json({ success: true, data: booking });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

// GET /api/v1/bookings/wallet
export const getWallet = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const wallet = await svc.getWallet(userId);
        res.json({ success: true, data: wallet });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};
