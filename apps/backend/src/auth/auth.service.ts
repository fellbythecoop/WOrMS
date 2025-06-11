import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(azureAdObjectId: string, email: string): Promise<User | null> {
    // Find or create user based on Azure AD information
    const user = await this.usersService.findByAzureAdObjectId(azureAdObjectId);
    if (user) {
      return user;
    }

    // Create new user if not exists
    return await this.usersService.createFromAzureAd({
      azureAdObjectId,
      email,
    });
  }

  async login(user: User) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }
} 