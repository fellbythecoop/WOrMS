import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(): Promise<Customer[]>;
    findById(id: string): Promise<Customer>;
    create(customerData: Partial<Customer>): Promise<Customer>;
    update(id: string, updateData: Partial<Customer>): Promise<Customer>;
    delete(id: string): Promise<void>;
    seedSampleCustomers(): Promise<Customer[]>;
}
