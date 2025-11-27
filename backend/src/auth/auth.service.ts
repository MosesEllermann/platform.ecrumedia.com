import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ClientsService } from '../clients/clients.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private clientsService: ClientsService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Ein Benutzer mit dieser E-Mail existiert bereits');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Determine role based on email
    const role = registerDto.email === 'admin@ecrumedia.com' ? 'ADMIN' : 'CLIENT';

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        company: registerDto.company,
        phone: registerDto.phone,
        role: role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Auto-create client profile for non-admin users
    if (role === 'CLIENT') {
      await this.clientsService.createFromUser(user.id, registerDto);
    }

    return {
      message: 'Registrierung erfolgreich',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Ihr Konto wurde deaktiviert');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: { email: user.email },
      },
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async logout(userId: string, token: string) {
    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
      },
    });

    return { message: 'Erfolgreich abgemeldet' };
  }

  async validateUser(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: true,
        vatNumber: true,
        homepage: true,
        phone: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
        profileImage: true,
        isActive: true,
        client: {
          select: {
            id: true,
            clientNumber: true,
            type: true,
            name: true,
            vatNumber: true,
            homepage: true,
          },
        },
      },
    });
  }

  async getClients() {
    return await this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async loginAsClient(adminId: string, clientId: string) {
    console.log('🔐 LOGIN-AS-CLIENT: Starting impersonation process', {
      adminId,
      clientId,
      timestamp: new Date().toISOString(),
    });

    // SECURITY LAYER 1: Verify admin exists and has ADMIN role
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      console.error('⚠️ SECURITY: Invalid admin ID in login-as-client', { adminId });
      throw new UnauthorizedException('Administrator nicht gefunden');
    }

    if (admin.role !== 'ADMIN') {
      // Log this as a security incident
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'FAILED_LOGIN_AS_CLIENT_ATTEMPT',
          details: {
            reason: 'Non-admin user attempted to impersonate',
            userId: adminId,
            userEmail: admin.email,
            userRole: admin.role,
            attemptedClientId: clientId,
            timestamp: new Date().toISOString(),
          },
        },
      });
      console.error('⚠️ SECURITY BREACH ATTEMPT: Non-admin tried to use login-as-client', {
        userId: adminId,
        email: admin.email,
        role: admin.role,
        attemptedClientId: clientId,
      });
      throw new UnauthorizedException('Nur Administratoren können diese Funktion nutzen');
    }

    // SECURITY LAYER 2: Verify admin account is active
    if (!admin.isActive) {
      console.error('⚠️ SECURITY: Inactive admin attempted login-as-client', { adminId });
      throw new UnauthorizedException('Ihr Administrator-Konto ist deaktiviert');
    }

    // SECURITY LAYER 3: Find and validate client
    const clientRecord = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true,
      },
    });

    if (!clientRecord || !clientRecord.user) {
      console.warn('⚠️ LOGIN-AS-CLIENT: Client not found', { clientId, adminId });
      throw new UnauthorizedException('Kunde nicht gefunden');
    }

    const client = clientRecord.user;

    // SECURITY LAYER 4: Ensure target is actually a CLIENT (not another admin)
    if (client.role !== 'CLIENT') {
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'FAILED_LOGIN_AS_CLIENT_ATTEMPT',
          details: {
            reason: 'Attempted to impersonate non-client account',
            adminId,
            adminEmail: admin.email,
            targetUserId: client.id,
            targetUserRole: client.role,
            timestamp: new Date().toISOString(),
          },
        },
      });
      console.error('⚠️ SECURITY: Admin attempted to impersonate non-client', {
        adminId,
        targetUserId: client.id,
        targetRole: client.role,
      });
      throw new UnauthorizedException('Sie können sich nur als Kunde anmelden');
    }

    // SECURITY LAYER 5: Verify client account is active
    if (!client.isActive) {
      console.warn('⚠️ LOGIN-AS-CLIENT: Attempted to access inactive client', {
        clientId: client.id,
        adminId,
      });
      throw new UnauthorizedException('Dieses Kundenkonto ist deaktiviert');
    }

    // SECURITY LAYER 6: Prevent self-impersonation (admin trying to impersonate themselves)
    if (admin.id === client.id) {
      console.error('⚠️ SECURITY: Admin attempted self-impersonation', { adminId });
      throw new UnauthorizedException('Sie können sich nicht selbst impersonieren');
    }

    console.log('✅ LOGIN-AS-CLIENT: All security checks passed', {
      adminId,
      adminEmail: admin.email,
      clientId: client.id,
      clientEmail: client.email,
    });

    // Create comprehensive audit log for admin impersonation
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'LOGIN_AS_CLIENT',
        details: {
          adminId: admin.id,
          adminEmail: admin.email,
          adminName: `${admin.firstName} ${admin.lastName}`,
          clientId: clientRecord.id,
          clientUserId: client.id,
          clientEmail: client.email,
          clientName: clientRecord.name,
          timestamp: new Date().toISOString(),
          ipAddress: 'N/A', // TODO: Add IP tracking if needed
        },
      },
    });

    // Generate JWT token for client with impersonation metadata
    const payload = {
      sub: client.id,
      email: client.email,
      role: client.role,
      impersonatedBy: adminId, // Track that this is an impersonated session
      impersonationTimestamp: new Date().toISOString(),
    };

    const accessToken = this.jwtService.sign(payload);

    // Create session for client with shorter expiration for security
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hours for impersonated sessions (shorter than normal)

    await this.prisma.session.create({
      data: {
        userId: client.id,
        token: accessToken,
        expiresAt,
      },
    });

    console.log('✅ LOGIN-AS-CLIENT: Successfully created impersonation session', {
      adminId,
      clientId: client.id,
      expiresAt,
    });

    return {
      access_token: accessToken,
      user: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        role: client.role,
        company: client.company,
      },
    };
  }

  async updateProfile(userId: string, updateProfileDto: any) {
    console.log('🔍 updateProfile called:', {
      userId,
      receivedData: updateProfileDto,
      hasName: 'name' in updateProfileDto,
      nameValue: updateProfileDto.name,
    });

    // If password change is requested, validate and hash it
    let hashedPassword: string | undefined;
    if (updateProfileDto.newPassword) {
      if (updateProfileDto.newPassword !== updateProfileDto.newPasswordConfirm) {
        throw new ConflictException('Passwörter stimmen nicht überein');
      }
      if (updateProfileDto.newPassword.length < 6) {
        throw new ConflictException('Passwort muss mindestens 6 Zeichen lang sein');
      }
      hashedPassword = await bcrypt.hash(updateProfileDto.newPassword, 10);
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateProfileDto.email,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        throw new ConflictException('Diese E-Mail wird bereits verwendet');
      }
    }

    // Update user data
    const updateUserData: any = {};
    if (updateProfileDto.firstName) updateUserData.firstName = updateProfileDto.firstName;
    if (updateProfileDto.lastName) updateUserData.lastName = updateProfileDto.lastName;
    if (updateProfileDto.email) updateUserData.email = updateProfileDto.email;
    if (updateProfileDto.phone !== undefined) updateUserData.phone = updateProfileDto.phone;
    if (updateProfileDto.address !== undefined) updateUserData.address = updateProfileDto.address;
    if (updateProfileDto.countryCode) updateUserData.country = updateProfileDto.countryCode;
    if (updateProfileDto.profileImage !== undefined) updateUserData.profileImage = updateProfileDto.profileImage;
    if (hashedPassword) updateUserData.password = hashedPassword;
    
    // For ADMIN users, store company data in User model (for invoicing)
    if (updateProfileDto.name !== undefined) updateUserData.company = updateProfileDto.name;
    if (updateProfileDto.vatNumber !== undefined) updateUserData.vatNumber = updateProfileDto.vatNumber;
    if (updateProfileDto.homepage !== undefined) updateUserData.homepage = updateProfileDto.homepage;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserData,
      include: { client: true },
    });

    console.log('👤 User updated:', {
      userId: user.id,
      hasClient: !!user.client,
      clientId: user.client?.id,
      clientName: user.client?.name,
    });

    // Update client data if user has a client profile
    if (user.client) {
      const updateClientData: any = {};
      if (updateProfileDto.type) updateClientData.type = updateProfileDto.type;
      if (updateProfileDto.name !== undefined) updateClientData.name = updateProfileDto.name;
      if (updateProfileDto.vatNumber !== undefined) updateClientData.vatNumber = updateProfileDto.vatNumber;
      if (updateProfileDto.homepage !== undefined) updateClientData.homepage = updateProfileDto.homepage;
      if (updateProfileDto.email) updateClientData.email = updateProfileDto.email;
      if (updateProfileDto.phone !== undefined) updateClientData.phone = updateProfileDto.phone;
      if (updateProfileDto.address !== undefined) updateClientData.address = updateProfileDto.address;
      if (updateProfileDto.countryCode) updateClientData.countryCode = updateProfileDto.countryCode;

      console.log('🔄 Updating client profile:', {
        clientId: user.client.id,
        updateData: updateClientData,
        nameInDto: updateProfileDto.name,
        nameIsUndefined: updateProfileDto.name === undefined,
        nameInUpdateData: updateClientData.name,
      });

      const updatedClient = await this.prisma.client.update({
        where: { id: user.client.id },
        data: updateClientData,
      });
      
      console.log('✅ Client profile updated successfully:', {
        clientId: updatedClient.id,
        newName: updatedClient.name,
      });
    } else if (user.role === 'CLIENT') {
      // If user is a CLIENT but has no client profile, create one
      console.log('⚠️ User is CLIENT but has no client profile, creating one...');
      await this.clientsService.createFromUser(userId, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        company: updateProfileDto.name || `${user.firstName} ${user.lastName}`,
      });
      console.log('✅ Client profile created');
    }

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        details: { 
          updatedFields: Object.keys(updateUserData),
          passwordChanged: !!hashedPassword,
        },
      },
    });

    // Return updated user data
    return this.validateUser(userId);
  }
}

