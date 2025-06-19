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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("./entities/customer.entity");
let CustomersService = class CustomersService {
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    async findAll() {
        return this.customerRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }
    async findById(id) {
        return this.customerRepository.findOne({
            where: { id, isActive: true },
        });
    }
    async create(customerData) {
        const customer = this.customerRepository.create(customerData);
        return this.customerRepository.save(customer);
    }
    async update(id, updateData) {
        await this.customerRepository.update(id, updateData);
        const updatedCustomer = await this.findById(id);
        if (!updatedCustomer) {
            throw new Error('Customer not found');
        }
        return updatedCustomer;
    }
    async delete(id) {
        await this.customerRepository.update(id, { isActive: false });
    }
    async seedSampleCustomers() {
        const sampleCustomers = [
            {
                name: 'Acme Corporation',
                address: '123 Business Ave, Suite 100, City, State 12345',
                primaryContactName: 'John Smith',
                primaryContactPhone: '(555) 123-4567',
                primaryContactEmail: 'john.smith@acme.com',
                secondaryContactName: 'Jane Doe',
                secondaryContactPhone: '(555) 123-4568',
                secondaryContactEmail: 'jane.doe@acme.com',
                notes: 'Main office building',
            },
            {
                name: 'Tech Solutions Inc',
                address: '456 Innovation Drive, Tech Park, City, State 67890',
                primaryContactName: 'Mike Johnson',
                primaryContactPhone: '(555) 987-6543',
                primaryContactEmail: 'mike.johnson@techsolutions.com',
                notes: 'Software development company',
            },
            {
                name: 'Manufacturing Co',
                address: '789 Industrial Blvd, Factory District, City, State 11111',
                primaryContactName: 'Sarah Wilson',
                primaryContactPhone: '(555) 456-7890',
                primaryContactEmail: 'sarah.wilson@manufacturing.com',
                secondaryContactName: 'Bob Brown',
                secondaryContactPhone: '(555) 456-7891',
                secondaryContactEmail: 'bob.brown@manufacturing.com',
                notes: 'Heavy machinery manufacturing',
            },
        ];
        const customers = [];
        for (const customerData of sampleCustomers) {
            const existingCustomer = await this.customerRepository.findOne({
                where: { name: customerData.name },
            });
            if (!existingCustomer) {
                const customer = this.customerRepository.create(customerData);
                customers.push(await this.customerRepository.save(customer));
            }
        }
        return customers;
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map