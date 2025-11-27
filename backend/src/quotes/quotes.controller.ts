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
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { SendQuoteDto } from './dto/send-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, QuoteStatus } from '@prisma/client';

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('status') status?: QuoteStatus,
    @Query('search') search?: string,
  ) {
    const user = req.user;
    // If user is a client, override userId with their own ID
    const effectiveUserId = user.role === UserRole.CLIENT ? user.id : userId;
    return this.quotesService.findAll(effectiveUserId, user.role, status, search);
  }

  @Get('stats')
  getStats(@Request() req) {
    const user = req.user;
    const userId = user.role === UserRole.CLIENT ? user.id : undefined;
    return this.quotesService.getStats(userId, user.role);
  }

  @Get('next-number')
  @Roles(UserRole.ADMIN)
  getNextQuoteNumber() {
    return this.quotesService.getNextQuoteNumber();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.quotesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto, @Request() req) {
    const user = req.user;
    return this.quotesService.update(id, updateQuoteDto, user.id, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.quotesService.remove(id, user.id, user.role);
  }

  @Post(':id/send')
  @Roles(UserRole.ADMIN)
  sendQuote(
    @Param('id') id: string,
    @Body() sendQuoteDto: SendQuoteDto,
    @Request() req,
  ) {
    const user = req.user;
    return this.quotesService.sendQuote(id, sendQuoteDto, user);
  }

  @Post(':id/convert-to-invoice')
  @Roles(UserRole.ADMIN)
  convertToInvoice(
    @Param('id') id: string,
    @Body() body: { dueDate?: string },
    @Request() req,
  ) {
    const user = req.user;
    return this.quotesService.convertToInvoice(id, user.id, user.role, body.dueDate);
  }
}
