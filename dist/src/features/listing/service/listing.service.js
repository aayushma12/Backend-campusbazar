"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingService = void 0;
const listing_repository_1 = require("../repository/listing.repository");
class ListingService {
    constructor() {
        this.listingRepository = new listing_repository_1.ListingRepository();
    }
    async create(userId, dto) {
        return this.listingRepository.create({ ...dto, userId });
    }
    async findById(id) {
        const listing = await this.listingRepository.findById(id);
        if (!listing)
            throw new Error('Listing not found');
        return listing;
    }
    async findMany(query) {
        const prismaQuery = {};
        if (query.category)
            prismaQuery.category = query.category;
        if (query.search)
            prismaQuery.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } }
            ];
        if (query.minPrice)
            prismaQuery.price = { gte: query.minPrice };
        if (query.maxPrice)
            prismaQuery.price = { ...prismaQuery.price, lte: query.maxPrice };
        return this.listingRepository.findMany(prismaQuery);
    }
    async update(userId, id, dto) {
        const listing = await this.listingRepository.findById(id);
        if (!listing)
            throw new Error('Listing not found');
        if (listing.userId !== userId)
            throw new Error('Unauthorized');
        return this.listingRepository.update(id, dto);
    }
    async delete(userId, id) {
        const listing = await this.listingRepository.findById(id);
        if (!listing)
            throw new Error('Listing not found');
        if (listing.userId !== userId)
            throw new Error('Unauthorized');
        await this.listingRepository.delete(id);
        return { message: 'Listing deleted' };
    }
    async addFavorite(userId, listingId) {
        await this.listingRepository.addFavorite(userId, listingId);
        return { message: 'Added to favorites' };
    }
    async getFavorites(userId) {
        return this.listingRepository.getFavorites(userId);
    }
}
exports.ListingService = ListingService;
