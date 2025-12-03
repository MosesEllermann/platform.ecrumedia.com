import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // Get next available client number
  async getNextClientNumber(): Promise<number> {
    const lastClient = await this.prisma.client.findFirst({
      orderBy: {
        clientNumber: 'desc',
      },
    });

    return lastClient ? lastClient.clientNumber + 1 : 1;
  }

  // Helper function to generate random password
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Create new client
  async create(createClientDto: CreateClientDto) {
    console.log('📝 Creating client with data:', {
      ...createClientDto,
      createUserAccount: createClientDto.createUserAccount,
    });

    // If client number not provided, auto-generate
    let clientNumber = createClientDto.clientNumber;
    if (!clientNumber) {
      clientNumber = await this.getNextClientNumber();
    }

    // Check if client number already exists
    const existingClient = await this.prisma.client.findUnique({
      where: { clientNumber },
    });

    if (existingClient) {
      throw new ConflictException(
        `Kundennummer ${clientNumber} ist bereits vergeben`,
      );
    }

    // If userId provided, check if user already has a client
    if (createClientDto.userId) {
      const userClient = await this.prisma.client.findUnique({
        where: { userId: createClientDto.userId },
      });

      if (userClient) {
        throw new ConflictException(
          'Dieser Benutzer hat bereits ein Kundenprofil',
        );
      }
    }

    let createdUserId: string | undefined = undefined;
    let temporaryPassword: string | undefined = undefined;

    // If createUserAccount is true, create a user account
    if (createClientDto.createUserAccount && !createClientDto.userId) {
      // Email is required for user account creation
      if (!createClientDto.email) {
        throw new ConflictException(
          'E-Mail-Adresse ist erforderlich, um ein Benutzerkonto zu erstellen',
        );
      }

      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Extract name from client data
      const nameParts = createClientDto.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const createdUser = await this.prisma.user.create({
        data: {
          email: createClientDto.email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'CLIENT',
        },
      });

      createdUserId = createdUser.id;
      temporaryPassword = tempPassword;
      console.log('✅ User account created:', {
        userId: createdUser.id,
        email: createdUser.email,
      });
    }

    const client = await this.prisma.client.create({
      data: {
        type: createClientDto.type,
        name: createClientDto.name,
        vatNumber: createClientDto.vatNumber,
        address: createClientDto.address,
        countryCode: createClientDto.countryCode,
        phone: createClientDto.phone,
        email: createClientDto.email,
        homepage: createClientDto.homepage,
        fixedNote: createClientDto.fixedNote,
        clientNumber,
        userId: createdUserId || createClientDto.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log('✅ Client created:', {
      clientId: client.id,
      clientNumber: client.clientNumber,
      name: client.name,
      hasUser: !!client.userId,
      hasTemporaryPassword: !!temporaryPassword,
    });

    // Return client and temporary password (for future email sending)
    return {
      client,
      temporaryPassword,
    };
  }

  // Find all clients
  async findAll() {
    return await this.prisma.client.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        clientNumber: 'asc',
      },
    });
  }

  // Find one client by ID
  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Kunde nicht gefunden');
    }

    return client;
  }

  // Update client
  async update(id: string, updateClientDto: UpdateClientDto) {
    console.log('🔄 Updating client:', id);
    console.log('📦 Update data received:', updateClientDto);

    // Check if client exists
    const existingClient = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!existingClient) {
      throw new NotFoundException('Kunde nicht gefunden');
    }

    console.log('📋 Existing client number:', existingClient.clientNumber);
    console.log('🆕 New client number:', updateClientDto.clientNumber);

    // If updating client number, check for conflicts
    if (
      updateClientDto.clientNumber &&
      updateClientDto.clientNumber !== existingClient.clientNumber
    ) {
      console.log('🔍 Checking for client number conflicts...');
      const conflictingClient = await this.prisma.client.findUnique({
        where: { clientNumber: updateClientDto.clientNumber },
      });

      if (conflictingClient) {
        throw new ConflictException(
          `Kundennummer ${updateClientDto.clientNumber} ist bereits vergeben`,
        );
      }
      console.log('✅ No conflicts found');
    }

    // If updating userId, check for conflicts
    if (
      updateClientDto.userId &&
      updateClientDto.userId !== existingClient.userId
    ) {
      const conflictingUserClient = await this.prisma.client.findUnique({
        where: { userId: updateClientDto.userId },
      });

      if (conflictingUserClient) {
        throw new ConflictException(
          'Dieser Benutzer hat bereits ein Kundenprofil',
        );
      }
    }

    // Handle password update for the associated user account
    if (updateClientDto['password'] && existingClient.userId) {
      const hashedPassword = await bcrypt.hash(updateClientDto['password'], 10);
      await this.prisma.user.update({
        where: { id: existingClient.userId },
        data: { password: hashedPassword },
      });
      console.log('✅ Password updated for user:', existingClient.userId);
    }

    // Handle email update for the associated user account
    if (updateClientDto.email && existingClient.userId) {
      // Check if email is already in use by another user
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateClientDto.email },
      });

      if (existingUser && existingUser.id !== existingClient.userId) {
        throw new ConflictException(
          'Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet',
        );
      }

      await this.prisma.user.update({
        where: { id: existingClient.userId },
        data: { email: updateClientDto.email },
      });
      console.log('✅ Email updated for user:', existingClient.userId);
    }

    // Handle firstName and lastName update for the associated user account
    if (existingClient.userId) {
      const userUpdateData: any = {};
      
      if (updateClientDto['firstName'] !== undefined) {
        userUpdateData.firstName = updateClientDto['firstName'];
      }
      
      if (updateClientDto['lastName'] !== undefined) {
        userUpdateData.lastName = updateClientDto['lastName'];
      }
      
      if (Object.keys(userUpdateData).length > 0) {
        await this.prisma.user.update({
          where: { id: existingClient.userId },
          data: userUpdateData,
        });
        console.log('✅ First/Last name updated for user:', existingClient.userId);
      }
    }

    // Remove password, firstName, lastName from updateClientDto as they're not client fields
    const { password, firstName, lastName, ...clientUpdateData } = updateClientDto as any;

    console.log('💾 Saving client data:', clientUpdateData);

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: clientUpdateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    console.log('✅ Client updated successfully:', {
      id: updatedClient.id,
      clientNumber: updatedClient.clientNumber,
      name: updatedClient.name,
    });

    return updatedClient;
  }

  // Delete client
  async remove(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Kunde nicht gefunden');
    }

    await this.prisma.client.delete({
      where: { id },
    });

    return { message: 'Kunde erfolgreich gelöscht' };
  }

  // Get statistics about clients
  async getStats() {
    const total = await this.prisma.client.count();
    
    return {
      total,
    };
  }

  // Create client profile for a user (called during registration)
  async createFromUser(userId: string, userData: any) {
    const clientNumber = await this.getNextClientNumber();

    return await this.prisma.client.create({
      data: {
        clientNumber,
        type: 'COMPANY', // Default to company
        name: userData.company || `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        countryCode: 'AT',
        userId,
      },
    });
  }
}
