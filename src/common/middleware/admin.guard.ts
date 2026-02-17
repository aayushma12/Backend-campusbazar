import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.guard';

export function adminGuard(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
}
