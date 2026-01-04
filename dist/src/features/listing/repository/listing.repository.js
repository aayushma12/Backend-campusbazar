"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingRepository = void 0;
const database_1 = require("../../../database/prisma/database");
class ListingRepository {
    async create(data) {
        return database_1.prisma.listing.create({ data });
    }
    async findById(id) {
        return database_1.prisma.listing.findUnique({ where: { id } });
    }
    async findMany(query) {
        return database_1.prisma.listing.findMany({ where: query });
    }
    async update(id, data) {
        return database_1.prisma.listing.update({ where: { id }, data });
    }
    async delete(id) {
        await database_1.prisma.listing.delete({ where: { id } });
    }
    async findByUser(userId) {
        return database_1.prisma.listing.findMany({ where: { userId } });
    }
    async addFavorite(userId, listingId) {
        await database_1.prisma.favorite.create({ data: { userId, listingId } });
    }
    async getFavorites(userId) {
        const favorites = await database_1.prisma.favorite.findMany({ where: { userId }, include: { listing: true } });
        return favorites.map((f) => f.listing);
    }
}
exports.ListingRepository = ListingRepository;
