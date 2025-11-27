import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, InvoiceStatus } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('search') search?: string,
  ) {
    const user = req.user;
    // If user is a client, override userId with their own ID
    const effectiveUserId = user.role === UserRole.CLIENT ? user.id : userId;
    return this.invoicesService.findAll(effectiveUserId, user.role, status, search);
  }

  @Get('stats')
  getStats(@Request() req) {
    const user = req.user;
    const userId = user.role === UserRole.CLIENT ? user.id : undefined;
    return this.invoicesService.getStats(userId, user.role);
  }

  @Get('next-number')
  @Roles(UserRole.ADMIN)
  getNextInvoiceNumber() {
    return this.invoicesService.getNextInvoiceNumber();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.invoicesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto, @Request() req) {
    const user = req.user;
    return this.invoicesService.update(id, updateInvoiceDto, user.id, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.invoicesService.remove(id, user.id, user.role);
  }

  @Post(':id/send')
  @Roles(UserRole.ADMIN)
  sendInvoice(
    @Param('id') id: string,
    @Body() sendInvoiceDto: SendInvoiceDto,
    @Request() req,
  ) {
    const user = req.user;
    return this.invoicesService.sendInvoice(id, sendInvoiceDto, user);
  }
}
