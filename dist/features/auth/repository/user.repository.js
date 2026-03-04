"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const user_model_1 = require("../entity/user.model");
class UserRepository {
    constructor() {
        this.model = user_model_1.UserModel;
    }
    async findByEmail(email) {
        return this.model.findOne({ email });
    }
    async create(user) {
        return this.model.create(user);
    }
    async findById(id) {
        return this.model.findById(id);
    }
    async update(id, update) {
        return this.model.findByIdAndUpdate(id, update, { new: true });
    }
    async findAll() {
        return this.model.find().sort({ createdAt: -1 });
    }
}
exports.UserRepository = UserRepository;
