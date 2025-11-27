import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { SendQuoteDto } from './dto/send-quote.dto';
import { QuoteStatus, UserRole, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { EmailService } from '../email/email.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pdfService: PdfService,
  ) {}

  // Generate unique quote number
  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastQuote = await this.prisma.quote.findFirst({
      where: {
        quoteNumber: {
          startsWith: `QUO-${year}-`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastQuote) {
      const parts = lastQuote.quoteNumber.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }

    return `QUO-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Public method to get next quote number for preview
  async getNextQuoteNumber(): Promise<{ nextQuoteNumber: string }> {
    const nextNumber = await this.generateQuoteNumber();
    return { nextQuoteNumber: nextNumber };
  }

  // Calculate quote totals
  private calculateTotals(items: { quantity: number; unitPrice: number }[], taxRate: number) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return {
      subtotal: new Decimal(subtotal.toFixed(2)),
      taxAmount: new Decimal(taxAmount.toFixed(2)),
      total: new Decimal(total.toFixed(2)),
    };
  }

  async create(createQuoteDto: CreateQuoteDto) {
    // Use provided quote number or generate a new one
    const quoteNumber = createQuoteDto.quoteNumber || await this.generateQuoteNumber();
    const isReverseCharge = createQuoteDto.isReverseCharge || false;
    
    // Default to 20% Austrian VAT, but 0% if reverse charge applies
    const taxRate = isReverseCharge ? 0 : (createQuoteDto.taxRate || 20);
    const totals = this.calculateTotals(createQuoteDto.items, taxRate);

    const reverseChargeNote = isReverseCharge 
      ? "Die Umsatzsteuerschuld geht auf den Leistungsempfänger über (Reverse Charge System)"
      : null;

    // Get userId from clientId if provided
    let userId = createQuoteDto.userId;
    const clientId = createQuoteDto.clientId;

    if (clientId && !userId) {
      // Fetch client to get userId
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });
      
      if (client?.userId) {
        userId = client.userId;
      } else {
        // If client has no user account, we need a userId for the quote
        throw new Error('Client has no associated user account');
      }
    }

    if (!userId) {
      throw new Error('Either userId or clientId with associated user is required');
    }

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        userId,
        clientId,
        issueDate: createQuoteDto.issueDate ? new Date(createQuoteDto.issueDate) : new Date(),
        validUntil: new Date(createQuoteDto.validUntil),
        servicePeriodStart: createQuoteDto.servicePeriodStart ? new Date(createQuoteDto.servicePeriodStart) : null,
        servicePeriodEnd: createQuoteDto.servicePeriodEnd ? new Date(createQuoteDto.servicePeriodEnd) : null,
        status: createQuoteDto.status || QuoteStatus.DRAFT,
        subtotal: totals.subtotal,
        taxRate: new Decimal(taxRate),
        taxAmount: totals.taxAmount,
        total: totals.total,
        isReverseCharge,
        reverseChargeNote,
        notes: createQuoteDto.notes,
        items: {
          create: createQuoteDto.items.map((item) => ({
            productName: item.productName || null,
            description: item.description,
            quantity: item.quantity,
            unitName: item.unitName || null,
            unitPrice: new Decimal(item.unitPrice.toFixed(2)),
            taxRate: item.taxRate !== undefined ? new Decimal(item.taxRate) : null,
            total: new Decimal((item.quantity * item.unitPrice).toFixed(2)),
          })),
        },
      },
      include: {
        items: true,
        client: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    });

    return quote;
  }

  async findAll(userId?: string, userRole?: UserRole, status?: QuoteStatus, search?: string) {
    const where: any = {};

    // If user is a client, only show their quotes
    if (userRole === UserRole.CLIENT) {
      where.userId = userId;
    } else if (userId) {
      // If userId is provided (for admins filtering), filter by it
      where.userId = userId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Search by quote number
    if (search) {
      where.quoteNumber = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const quotes = await this.prisma.quote.findMany({
      where,
      include: {
        items: true,
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
            type: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return quotes;
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
        user: {
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
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // Clients can only view their own quotes
    if (userRole === UserRole.CLIENT && quote.userId !== userId) {
      throw new ForbiddenException('You do not have access to this quote');
    }

    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto, userId: string, userRole: UserRole) {
    // First check if quote exists and user has access
    const quote = await this.findOne(id, userId, userRole);

    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        validUntil: updateQuoteDto.validUntil ? new Date(updateQuoteDto.validUntil) : undefined,
        servicePeriodStart: updateQuoteDto.servicePeriodStart ? new Date(updateQuoteDto.servicePeriodStart) : undefined,
        servicePeriodEnd: updateQuoteDto.servicePeriodEnd ? new Date(updateQuoteDto.servicePeriodEnd) : undefined,
        status: updateQuoteDto.status,
        taxRate: updateQuoteDto.taxRate !== undefined ? new Decimal(updateQuoteDto.taxRate) : undefined,
        isReverseCharge: updateQuoteDto.isReverseCharge,
        notes: updateQuoteDto.notes,
        pdfUrl: updateQuoteDto.pdfUrl,
      },
      include: {
        items: true,
        client: true,
        user: true,
      },
    });

    return updatedQuote;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    // First check if quote exists and user has access
    await this.findOne(id, userId, userRole);

    await this.prisma.quote.delete({
      where: { id },
    });

    return { message: 'Quote deleted successfully' };
  }

  async getStats(userId?: string, userRole?: UserRole) {
    const where: any = {};

    // If user is a client, only count their quotes
    if (userRole === UserRole.CLIENT && userId) {
      where.userId = userId;
    }

    const [total, draft, sent, accepted, declined, converted] = await Promise.all([
      this.prisma.quote.count({ where }),
      this.prisma.quote.count({ where: { ...where, status: QuoteStatus.DRAFT } }),
      this.prisma.quote.count({ where: { ...where, status: QuoteStatus.SENT } }),
      this.prisma.quote.count({ where: { ...where, status: QuoteStatus.ACCEPTED } }),
      this.prisma.quote.count({ where: { ...where, status: QuoteStatus.DECLINED } }),
      this.prisma.quote.count({ where: { ...where, status: QuoteStatus.CONVERTED } }),
    ]);

    return {
      total,
      draft,
      sent,
      accepted,
      declined,
      converted,
    };
  }

  async sendQuote(quoteId: string, sendQuoteDto: SendQuoteDto, currentUser: any) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        items: true,
        client: true,
        user: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!quote.client) {
      throw new NotFoundException('Quote has no associated client');
    }

    // Generate PDF if not already generated
    let pdfBuffer: Buffer;
    try {
      const quoteData = {
        quoteNumber: quote.quoteNumber,
        issueDate: quote.issueDate.toISOString().split('T')[0],
        validUntil: quote.validUntil.toISOString().split('T')[0],
        servicePeriodStart: quote.servicePeriodStart ? quote.servicePeriodStart.toISOString().split('T')[0] : undefined,
        servicePeriodEnd: quote.servicePeriodEnd ? quote.servicePeriodEnd.toISOString().split('T')[0] : undefined,
        client: {
          clientNumber: quote.client.clientNumber,
          name: quote.client.name,
          type: quote.client.type,
          vatNumber: quote.client.vatNumber || undefined,
          address: quote.client.address || undefined,
          countryCode: quote.client.countryCode,
          phone: quote.client.phone || undefined,
          email: quote.client.email || undefined,
        },
        items: quote.items.map((item) => ({
          productName: item.productName || undefined,
          description: item.description,
          quantity: item.quantity,
          unitName: item.unitName || undefined,
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
        })),
        isReverseCharge: quote.isReverseCharge,
        notes: quote.notes || undefined,
        subtotal: Number(quote.subtotal),
        taxAmount: Number(quote.taxAmount),
        total: Number(quote.total),
        user: {
          firstName: quote.user.firstName,
          lastName: quote.user.lastName,
          company: quote.user.company || undefined,
          address: quote.user.address || undefined,
          city: quote.user.city || undefined,
          postalCode: quote.user.postalCode || undefined,
          country: quote.user.country || undefined,
          phone: quote.user.phone || undefined,
          email: quote.user.email,
          vatNumber: quote.user.vatNumber || undefined,
          homepage: quote.user.homepage || undefined,
        },
      };

      pdfBuffer = await this.pdfService.generateQuotePDF(quoteData);
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }

    // Send email with PDF attachment
    try {
      await this.emailService.sendQuoteEmail({
        to: sendQuoteDto.recipientEmail,
        subject: sendQuoteDto.subject,
        body: sendQuoteDto.body,
        pdfBuffer,
        quoteNumber: quote.quoteNumber,
        sendCopyToSelf: sendQuoteDto.sendCopyToSelf,
        senderEmail: currentUser.email,
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    // Update quote status to SENT
    const updatedQuote = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: QuoteStatus.SENT,
      },
      include: {
        items: true,
        client: true,
        user: true,
      },
    });

    return {
      message: 'Quote sent successfully',
      quote: updatedQuote,
    };
  }

  // Convert quote to invoice
  async convertToInvoice(quoteId: string, userId: string, userRole: UserRole, dueDate?: string) {
    // First check if quote exists and user has access
    const quote = await this.findOne(quoteId, userId, userRole);

    // Check if quote is already converted
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new ForbiddenException('Quote has already been converted to an invoice');
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }
    const invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;

    // Calculate due date (30 days from now if not provided)
    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create invoice from quote
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: quote.userId,
        clientId: quote.clientId,
        issueDate: new Date(),
        dueDate: calculatedDueDate,
        servicePeriodStart: quote.servicePeriodStart,
        servicePeriodEnd: quote.servicePeriodEnd,
        status: InvoiceStatus.DRAFT,
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        isReverseCharge: quote.isReverseCharge,
        reverseChargeNote: quote.reverseChargeNote,
        notes: quote.notes,
        items: {
          create: quote.items.map((item) => ({
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unitName: item.unitName,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
        client: true,
        user: true,
      },
    });

    // Update quote status to CONVERTED
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: QuoteStatus.CONVERTED,
        convertedToInvoiceId: invoice.id,
        convertedAt: new Date(),
      },
    });

    return {
      message: 'Quote successfully converted to invoice',
      invoice,
    };
  }
}
