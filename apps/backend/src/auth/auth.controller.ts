import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('azure-login')
  @ApiOperation({ summary: 'Login with Azure AD token' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async azureLogin(@Body() loginDto: { azureAdObjectId: string; email: string; firstName?: string; lastName?: string }) {
    const user = await this.authService.validateUser(loginDto.azureAdObjectId, loginDto.email);
    if (!user) {
      throw new Error('Authentication failed');
    }
    return this.authService.login(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  async verifyToken(@Body() body: { token: string }) {
    const payload = await this.authService.verifyToken(body.token);
    if (!payload) {
      throw new Error('Invalid token');
    }
    return { valid: true, payload };
  }
} 