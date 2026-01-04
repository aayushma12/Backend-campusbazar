"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listing_controller_1 = __importDefault(require("../controller/listing.controller"));
const validate_body_middleware_1 = require("../../auth/middleware/validate-body.middleware");
const create_listing_dto_1 = require("../dto/create-listing.dto");
const update_listing_dto_1 = require("../dto/update-listing.dto");
const auth_guard_1 = require("../../../common/middleware/auth.guard");
const router = (0, express_1.Router)();
router.post('/', auth_guard_1.authGuard, (0, validate_body_middleware_1.validateBody)(create_listing_dto_1.CreateListingDto), listing_controller_1.default.create);
router.get('/', listing_controller_1.default.findMany);
router.get('/:id', listing_controller_1.default.findById);
router.patch('/:id', auth_guard_1.authGuard, (0, validate_body_middleware_1.validateBody)(update_listing_dto_1.UpdateListingDto), listing_controller_1.default.update);
router.delete('/:id', auth_guard_1.authGuard, listing_controller_1.default.remove);
router.post('/:id/favorite', auth_guard_1.authGuard, listing_controller_1.default.addFavorite);
exports.default = router;
