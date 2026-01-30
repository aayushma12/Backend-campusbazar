"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validateBody = (DtoClass) => {
    return async (req, res, next) => {
        const dtoObj = (0, class_transformer_1.plainToInstance)(DtoClass, req.body);
        const errors = await (0, class_validator_1.validate)(dtoObj);
        if (errors.length > 0) {
            return res.status(400).json({ message: 'Validation failed', errors });
        }
        next();
    };
};
exports.validateBody = validateBody;
