import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, Param, ForbiddenException, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    console.log('🎯 Profile update request received:', {
      userId: req.user.id,
      data: updateProfileDto,
    });
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('clients')
  async getClients(@Request() req) {
    // Only admins can get the list of clients
    const user = await this.authService.validateUser(req.user.id);
    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can access this endpoint');
    }
    return this.authService.getClients();
  }

  /**
   * CRITICAL SECURITY ENDPOINT
   * Allows admins to impersonate client accounts
   * Multiple layers of protection:
   * 1. JwtAuthGuard - Requires valid authentication
   * 2. RolesGuard - Requires ADMIN role
   * 3. Additional validation in service layer
   * 4. Audit logging of all impersonation attempts
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('login-as-client/:clientId')
  async loginAsClient(@Request() req, @Param('clientId') clientId: string) {
    // Triple-check admin status (defense in depth)
    const admin = await this.authService.validateUser(req.user.id);
    
    if (!admin) {
      throw new UnauthorizedException('User not found');
    }
    
    if (admin.role !== UserRole.ADMIN) {
      // Log this attempt as it's potentially malicious
      console.error('⚠️ SECURITY: Non-admin attempted to use login-as-client', {
        userId: req.user.id,
        userEmail: admin.email,
        userRole: admin.role,
        attemptedClientId: clientId,
        timestamp: new Date().toISOString(),
      });
      throw new ForbiddenException('This feature is restricted to administrators only');
    }
    
    return this.authService.loginAsClient(admin.id, clientId);
  }
}


