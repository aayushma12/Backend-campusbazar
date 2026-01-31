import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (DtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`--- VALIDATING BODY for ${req.method} ${req.url} ---`);
      console.log('Request Body:', JSON.stringify(req.body, null, 2));

      const dtoObj = plainToInstance(DtoClass, req.body);
      const errors = await validate(dtoObj as any);

      if (errors.length > 0) {
        const errorDetails = errors.map(err => ({
          property: err.property,
          value: err.value,
          constraints: err.constraints,
        }));

        console.log('--- VALIDATION ERROR DETECTED ---');
        console.log('Validation Failed details:', JSON.stringify(errorDetails, null, 2));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorDetails
        });
      }
      next();
    } catch (err) {
      console.error('--- VALIDATION MIDDLEWARE ERROR ---', err);
      next(err);
    }
  };
};
