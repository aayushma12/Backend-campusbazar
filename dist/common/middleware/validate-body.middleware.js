"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
function validateBody(type) {
    return async (req, res, next) => {
        const dto = (0, class_transformer_1.plainToInstance)(type, req.body);
        const errors = await (0, class_validator_1.validate)(dto);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.map(e => ({
                    property: e.property,
                    constraints: e.constraints,
                })),
            });
        }
        req.body = dto;
        next();
    };
}
