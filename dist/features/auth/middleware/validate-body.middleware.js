"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validateBody = (DtoClass) => {
    return async (req, res, next) => {
        try {
            console.log(`--- VALIDATING BODY for ${req.method} ${req.url} ---`);
            console.log('Request Body:', JSON.stringify(req.body, null, 2));
            const dtoObj = (0, class_transformer_1.plainToInstance)(DtoClass, req.body);
            const errors = await (0, class_validator_1.validate)(dtoObj);
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
        }
        catch (err) {
            console.error('--- VALIDATION MIDDLEWARE ERROR ---', err);
            next(err);
        }
    };
};
exports.validateBody = validateBody;
