import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('next-number')
  @Roles(UserRole.ADMIN)
  getNextNumber() {
    return this.clientsService.getNextClientNumber();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const client = await this.clientsService.findOne(id);
    
    // Map user firstName and lastName to top level
    return {
      ...client,
      firstName: client.user?.firstName || null,
      lastName: client.user?.lastName || null,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    const client = await this.clientsService.update(id, updateClientDto);
    
    // Map user firstName and lastName to top level
    return {
      ...client,
      firstName: client.user?.firstName || null,
      lastName: client.user?.lastName || null,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
