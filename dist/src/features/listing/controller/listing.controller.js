"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavorite = exports.remove = exports.update = exports.findById = exports.findMany = exports.create = void 0;
const listing_service_1 = require("../service/listing.service");
const listingService = new listing_service_1.ListingService();
const create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const dto = req.body;
        const listing = await listingService.create(userId, dto);
        res.status(201).json(listing);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.create = create;
const findMany = async (req, res, next) => {
    try {
        const query = req.query;
        const listings = await listingService.findMany(query);
        res.json(listings);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.findMany = findMany;
const findById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const listing = await listingService.findById(id);
        res.json(listing);
    }
    catch (err) {
        next({ status: 404, message: err.message });
    }
};
exports.findById = findById;
const update = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const dto = req.body;
        const updated = await listingService.update(userId, id, dto);
        res.json(updated);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.update = update;
const remove = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const result = await listingService.delete(userId, id);
        res.json(result);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.remove = remove;
const addFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const listingId = req.params.id;
        const result = await listingService.addFavorite(userId, listingId);
        res.json(result);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.addFavorite = addFavorite;
exports.default = { create: exports.create, findMany: exports.findMany, findById: exports.findById, update: exports.update, remove: exports.remove, addFavorite: exports.addFavorite };
