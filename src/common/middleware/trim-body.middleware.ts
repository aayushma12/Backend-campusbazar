import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to recursively trim whitespace and tabs from string values in req.body
 */
export const trimBody = (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            // Trim the key itself (handles cases like "collegeId ")
            const trimmedKey = key.trim();
            const value = req.body[key];

            if (trimmedKey !== key) {
                req.body[trimmedKey] = value;
                delete req.body[key];
            }

            // Trim the value if it's a string
            if (typeof req.body[trimmedKey] === 'string') {
                req.body[trimmedKey] = req.body[trimmedKey].replace(/\t/g, '').trim();
            }
        });
    }
    next();
};
