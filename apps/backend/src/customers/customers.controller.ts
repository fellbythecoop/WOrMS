import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(DevAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'List of customers', type: [Customer] })
  async findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer found', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findById(@Param('id') id: string): Promise<Customer> {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully', type: Customer })
  async create(@Body() customerData: Partial<Customer>): Promise<Customer> {
    return this.customersService.create(customerData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<Customer>,
  ): Promise<Customer> {
    return this.customersService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer (soft delete)' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.customersService.delete(id);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed sample customers' })
  @ApiResponse({ status: 201, description: 'Sample customers created', type: [Customer] })
  async seedSampleCustomers(): Promise<Customer[]> {
    return this.customersService.seedSampleCustomers();
  }
} 