import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async create(customerData: Partial<Customer>): Promise<Customer> {
    const customer = this.customerRepository.create(customerData);
    return this.customerRepository.save(customer);
  }

  async update(id: string, updateData: Partial<Customer>): Promise<Customer> {
    await this.customerRepository.update(id, updateData);
    const updatedCustomer = await this.findById(id);
    if (!updatedCustomer) {
      throw new Error('Customer not found');
    }
    return updatedCustomer;
  }

  async delete(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await this.customerRepository.update(id, { isActive: false });
  }

  async seedSampleCustomers(): Promise<Customer[]> {
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
} 