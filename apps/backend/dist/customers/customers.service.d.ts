import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
export declare class CustomersService {
    private readonly customerRepository;
    constructor(customerRepository: Repository<Customer>);
    findAll(): Promise<Customer[]>;
    findById(id: string): Promise<Customer | null>;
    create(customerData: Partial<Customer>): Promise<Customer>;
    update(id: string, updateData: Partial<Customer>): Promise<Customer>;
    delete(id: string): Promise<void>;
    seedSampleCustomers(): Promise<Customer[]>;
}
