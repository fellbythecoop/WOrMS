import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByAzureAdObjectId(azureAdObjectId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { azureAdObjectId } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async createFromAzureAd(data: {
    azureAdObjectId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      azureAdObjectId: data.azureAdObjectId,
      email: data.email,
      firstName: data.firstName || 'Unknown',
      lastName: data.lastName || 'User',
      role: UserRole.REQUESTER, // Default role
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async seedSampleUsers(): Promise<User[]> {
    // Check if users already exist
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0) {
      return this.findAll(); // Return existing users if any
    }

    const sampleUsers = [
      {
        email: 'admin@woms.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMINISTRATOR,
        department: 'IT',
      },
      {
        email: 'tech1@woms.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: UserRole.TECHNICIAN,
        department: 'Maintenance',
      },
      {
        email: 'tech2@woms.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: UserRole.TECHNICIAN,
        department: 'Facilities',
      },
      {
        email: 'manager@woms.com',
        firstName: 'David',
        lastName: 'Brown',
        role: UserRole.MANAGER,
        department: 'Operations',
      },
      {
        email: 'requester@woms.com',
        firstName: 'Emma',
        lastName: 'Davis',
        role: UserRole.REQUESTER,
        department: 'Sales',
      },
    ];

    const users = sampleUsers.map(userData => this.userRepository.create(userData));
    return this.userRepository.save(users);
  }
} 