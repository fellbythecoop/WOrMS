"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async findByAzureAdObjectId(azureAdObjectId) {
        return this.userRepository.findOne({ where: { azureAdObjectId } });
    }
    async findByRole(role) {
        return this.userRepository.find({ where: { role } });
    }
    async create(userData) {
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }
    async createFromAzureAd(data) {
        const user = this.userRepository.create({
            azureAdObjectId: data.azureAdObjectId,
            email: data.email,
            firstName: data.firstName || 'Unknown',
            lastName: data.lastName || 'User',
            role: user_entity_1.UserRole.REQUESTER,
        });
        return this.userRepository.save(user);
    }
    async findAll() {
        return this.userRepository.find();
    }
    async update(id, updateData) {
        await this.userRepository.update(id, updateData);
        return this.findById(id);
    }
    async delete(id) {
        await this.userRepository.delete(id);
    }
    async seedSampleUsers() {
        const existingUsers = await this.userRepository.count();
        if (existingUsers > 0) {
            return this.findAll();
        }
        const sampleUsers = [
            {
                email: 'admin@woms.com',
                firstName: 'Admin',
                lastName: 'User',
                role: user_entity_1.UserRole.ADMINISTRATOR,
                department: 'IT',
            },
            {
                email: 'tech1@woms.com',
                firstName: 'Mike',
                lastName: 'Johnson',
                role: user_entity_1.UserRole.TECHNICIAN,
                department: 'Maintenance',
            },
            {
                email: 'tech2@woms.com',
                firstName: 'Sarah',
                lastName: 'Wilson',
                role: user_entity_1.UserRole.TECHNICIAN,
                department: 'Facilities',
            },
            {
                email: 'manager@woms.com',
                firstName: 'David',
                lastName: 'Brown',
                role: user_entity_1.UserRole.MANAGER,
                department: 'Operations',
            },
            {
                email: 'requester@woms.com',
                firstName: 'Emma',
                lastName: 'Davis',
                role: user_entity_1.UserRole.REQUESTER,
                department: 'Sales',
            },
        ];
        const users = sampleUsers.map(userData => this.userRepository.create(userData));
        return this.userRepository.save(users);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map