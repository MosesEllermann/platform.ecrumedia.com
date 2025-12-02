import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { InvoiceStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { EmailService } from '../email/email.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pdfService: PdfService,
  ) {}

  // Generate unique invoice number
  private async generateInvoiceNumber(): Promise<string> {
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

    return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Public method to get next invoice number for preview
  async getNextInvoiceNumber(): Promise<{ nextInvoiceNumber: string }> {
    const nextNumber = await this.generateInvoiceNumber();
    return { nextInvoiceNumber: nextNumber };
  }

  // Helper to parse date string in Vienna timezone
  private parseDateInViennaTimezone(dateString: string): Date {
    // Parse the date string (YYYY-MM-DD format)
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    
    // Create a date at noon UTC to avoid any timezone issues
    // When formatted in Vienna timezone (UTC+1 or UTC+2), this will always show the correct date
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    return date;
  }

  // Calculate invoice totals
  private calculateTotals(items: { quantity: number; unitPrice: number; discount?: number }[], taxRate: number, globalDiscount: number = 0) {
    // Round each line item to 2 decimals BEFORE summing to avoid floating point errors
    const itemsSubtotal = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const discountAmount = item.discount ? (lineTotal * item.discount) / 100 : 0;
      const itemTotal = lineTotal - discountAmount;
      // Round each item total to 2 decimal places
      const roundedItemTotal = Math.round(itemTotal * 100) / 100;
      return sum + roundedItemTotal;
    }, 0);

    // Apply global discount to the subtotal (after line-item discounts)
    const globalDiscountAmount = (itemsSubtotal * globalDiscount) / 100;
    const subtotal = itemsSubtotal - globalDiscountAmount;

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return {
      subtotal: new Decimal(subtotal.toFixed(2)),
      taxAmount: new Decimal(taxAmount.toFixed(2)),
      total: new Decimal(total.toFixed(2)),
    };
  }

  async create(createInvoiceDto: CreateInvoiceDto, adminUserId?: string) {
    // Use provided invoice number or generate a new one
    const invoiceNumber = createInvoiceDto.invoiceNumber || await this.generateInvoiceNumber();
    const isReverseCharge = createInvoiceDto.isReverseCharge || false;
    
    // Default to 20% Austrian VAT, but 0% if reverse charge applies
    const taxRate = isReverseCharge ? 0 : (createInvoiceDto.taxRate || 20);
    const globalDiscount = createInvoiceDto.globalDiscount || 0;
    const totals = this.calculateTotals(createInvoiceDto.items, taxRate, globalDiscount);

    const reverseChargeNote = isReverseCharge 
      ? "Die Umsatzsteuerschuld geht auf den Leistungsempfänger über (Reverse Charge System)"
      : null;

    // Get userId from clientId if provided, or use adminUserId as fallback
    let userId = createInvoiceDto.userId || adminUserId;
    const clientId = createInvoiceDto.clientId;

    if (clientId && !createInvoiceDto.userId) {
      // Fetch client to get userId
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });
      
      if (client?.userId) {
        userId = client.userId;
      }
      // If client has no user, fall back to adminUserId
    }

    if (!userId) {
      throw new BadRequestException('Unable to determine user for invoice');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        clientId,
        issueDate: createInvoiceDto.issueDate ? this.parseDateInViennaTimezone(createInvoiceDto.issueDate) : new Date(),
        dueDate: this.parseDateInViennaTimezone(createInvoiceDto.dueDate),
        servicePeriodStart: createInvoiceDto.servicePeriodStart ? this.parseDateInViennaTimezone(createInvoiceDto.servicePeriodStart) : null,
        servicePeriodEnd: createInvoiceDto.servicePeriodEnd ? this.parseDateInViennaTimezone(createInvoiceDto.servicePeriodEnd) : null,
        status: createInvoiceDto.status || InvoiceStatus.DRAFT,
        subtotal: totals.subtotal,
        taxRate: new Decimal(taxRate),
        taxAmount: totals.taxAmount,
        total: totals.total,
        globalDiscount: createInvoiceDto.globalDiscount ? new Decimal(createInvoiceDto.globalDiscount) : new Decimal(0),
        isReverseCharge,
        reverseChargeNote,
        notes: createInvoiceDto.notes,
        items: {
          create: createInvoiceDto.items.map((item) => {
            const lineTotal = item.quantity * item.unitPrice;
            const discountAmount = item.discount ? (lineTotal * item.discount) / 100 : 0;
            const itemTotal = lineTotal - discountAmount;
            
            return {
              productName: item.productName || null,
              description: item.description || '',
              quantity: item.quantity,
              unitName: item.unitName || null,
              unitPrice: new Decimal(item.unitPrice.toFixed(2)),
              taxRate: item.taxRate !== undefined ? new Decimal(item.taxRate) : null,
              discount: item.discount !== undefined ? new Decimal(item.discount) : new Decimal(0),
              total: new Decimal(itemTotal.toFixed(2)),
            };
          }),
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

    return invoice;
  }

  async findAll(userId?: string, userRole?: UserRole, status?: InvoiceStatus, search?: string) {
    const where: any = {};

    // If user is a client, only show their invoices
    if (userRole === UserRole.CLIENT && userId) {
      where.userId = userId;
    }

    // If specific userId is provided as a filter (admin filtering by specific user)
    // Only apply this filter if explicitly requested, not by default
    // Admin sees all invoices by default unless filtering by userId

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by invoice number
    if (search) {
      where.invoiceNumber = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invoices;
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
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

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Clients can only view their own invoices
    if (userRole === UserRole.CLIENT && invoice.userId !== userId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId: string, userRole: UserRole) {
    const invoice = await this.findOne(id, userId, userRole);

    // Only admins can update invoices
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update invoices');
    }

    // Only allow updating DRAFT invoices if items are being updated
    if (updateInvoiceDto.items && invoice.status !== InvoiceStatus.DRAFT) {
      throw new ForbiddenException('Only draft invoices can have their items updated');
    }

    const updateData: any = {
      clientId: updateInvoiceDto.clientId,
      invoiceNumber: updateInvoiceDto.invoiceNumber,
      status: updateInvoiceDto.status,
      isReverseCharge: updateInvoiceDto.isReverseCharge,
      notes: updateInvoiceDto.notes,
      pdfUrl: updateInvoiceDto.pdfUrl,
      paidAmount: updateInvoiceDto.paidAmount,
      globalDiscount: updateInvoiceDto.globalDiscount !== undefined ? new Decimal(updateInvoiceDto.globalDiscount) : undefined,
    };

    // Convert date strings to Date objects
    if (updateInvoiceDto.issueDate) {
      updateData.issueDate = this.parseDateInViennaTimezone(updateInvoiceDto.issueDate);
    }
    if (updateInvoiceDto.dueDate) {
      updateData.dueDate = this.parseDateInViennaTimezone(updateInvoiceDto.dueDate);
    }
    if (updateInvoiceDto.paidAt) {
      updateData.paidAt = this.parseDateInViennaTimezone(updateInvoiceDto.paidAt);
    }
    if (updateInvoiceDto.servicePeriodStart) {
      updateData.servicePeriodStart = this.parseDateInViennaTimezone(updateInvoiceDto.servicePeriodStart);
    }
    if (updateInvoiceDto.servicePeriodEnd) {
      updateData.servicePeriodEnd = this.parseDateInViennaTimezone(updateInvoiceDto.servicePeriodEnd);
    }

    // If status is being set to PAID, record payment info
    if (updateInvoiceDto.status === InvoiceStatus.PAID && invoice.status !== InvoiceStatus.PAID) {
      updateData.paidAt = new Date();
      updateData.paidAmount = invoice.total;
    }

    // Handle items update if provided
    if (updateInvoiceDto.items && updateInvoiceDto.items.length > 0) {
      // Validate that all items have required fields
      updateInvoiceDto.items.forEach((item, index) => {
        if (item.quantity === undefined || item.quantity === null) {
          throw new BadRequestException(`Item ${index + 1} is missing quantity`);
        }
        if (item.unitPrice === undefined || item.unitPrice === null) {
          throw new BadRequestException(`Item ${index + 1} is missing unit price`);
        }
      });

      // Calculate totals from items
      const taxRate = updateInvoiceDto.isReverseCharge !== undefined 
        ? (updateInvoiceDto.isReverseCharge ? 0 : 20) 
        : (invoice.isReverseCharge ? 0 : 20);
      
      const isReverseCharge = updateInvoiceDto.isReverseCharge !== undefined 
        ? updateInvoiceDto.isReverseCharge 
        : invoice.isReverseCharge;

      const reverseChargeNote = isReverseCharge 
        ? 'Die Umsatzsteuerschuld geht auf den Leistungsempfänger über (Reverse Charge System)' 
        : null;

      const itemsForCalculation = updateInvoiceDto.items.map(item => ({
        quantity: item.quantity!,
        unitPrice: item.unitPrice!,
        discount: item.discount,
      }));

      const globalDiscount = updateInvoiceDto.globalDiscount !== undefined 
        ? updateInvoiceDto.globalDiscount 
        : Number(invoice.globalDiscount);

      const totals = this.calculateTotals(itemsForCalculation, taxRate, globalDiscount);

      updateData.subtotal = totals.subtotal;
      updateData.taxRate = new Decimal(taxRate);
      updateData.taxAmount = totals.taxAmount;
      updateData.total = totals.total;
      updateData.isReverseCharge = isReverseCharge;
      updateData.reverseChargeNote = reverseChargeNote;

      // Delete existing items and create new ones
      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      updateData.items = {
        create: updateInvoiceDto.items.map((item) => {
          const lineTotal = item.quantity! * item.unitPrice!;
          const discountAmount = item.discount ? (lineTotal * item.discount) / 100 : 0;
          const itemTotal = lineTotal - discountAmount;
          
          return {
            productName: item.productName || null,
            description: item.description || '',
            quantity: item.quantity!,
            unitName: item.unitName || null,
            unitPrice: new Decimal(item.unitPrice!.toFixed(2)),
            taxRate: item.taxRate !== undefined ? new Decimal(item.taxRate) : null,
            discount: item.discount !== undefined ? new Decimal(item.discount) : new Decimal(0),
            total: new Decimal(itemTotal.toFixed(2)),
          };
        }),
      };
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        client: true,
      },
    });

    return updatedInvoice;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    await this.findOne(id, userId, userRole);

    // Only admins can delete invoices
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete invoices');
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
  }

  async getStats(userId?: string, userRole?: UserRole) {
    const where: any = {};
    
    if (userRole === UserRole.CLIENT && userId) {
      where.userId = userId;
    }

    const [total, paid, unpaid, overdue] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.PAID } }),
      this.prisma.invoice.count({ 
        where: { 
          ...where, 
          status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT] } 
        } 
      }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.OVERDUE } }),
    ]);

    const totalAmount = await this.prisma.invoice.aggregate({
      where,
      _sum: {
        total: true,
      },
    });

    const paidAmount = await this.prisma.invoice.aggregate({
      where: { ...where, status: InvoiceStatus.PAID },
      _sum: {
        total: true,
      },
    });

    const totalAmountValue = totalAmount._sum.total ? Number(totalAmount._sum.total) : 0;
    const paidAmountValue = paidAmount._sum.total ? Number(paidAmount._sum.total) : 0;

    return {
      total,
      paid,
      unpaid,
      overdue,
      totalAmount: totalAmountValue,
      paidAmount: paidAmountValue,
      unpaidAmount: totalAmountValue - paidAmountValue,
    };
  }

  async sendInvoice(invoiceId: string, sendInvoiceDto: SendInvoiceDto, currentUser: any) {
    // Find the invoice with all related data
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        client: true,
        user: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.client) {
      throw new NotFoundException('Invoice has no associated client');
    }

    // Check authorization
    if (currentUser.role !== UserRole.ADMIN && invoice.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to send this invoice');
    }

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      servicePeriodStart: invoice.servicePeriodStart || undefined,
      servicePeriodEnd: invoice.servicePeriodEnd || undefined,
      client: {
        clientNumber: invoice.client.clientNumber,
        name: invoice.client.name,
        type: invoice.client.type,
        vatNumber: invoice.client.vatNumber || undefined,
        address: invoice.client.address || undefined,
        countryCode: invoice.client.countryCode,
        phone: invoice.client.phone || undefined,
        email: invoice.client.email || undefined,
      },
      items: invoice.items.map((item) => ({
        productName: item.productName || undefined,
        description: item.description,
        quantity: Number(item.quantity),
        unitName: item.unitName || undefined,
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discount: item.discount ? Number(item.discount) : undefined,
      })),
      isReverseCharge: invoice.isReverseCharge,
      notes: invoice.notes || undefined,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      user: {
        firstName: invoice.user.firstName,
        lastName: invoice.user.lastName,
        company: invoice.user.company,
        address: invoice.user.address,
        city: invoice.user.city,
        postalCode: invoice.user.postalCode,
        country: invoice.user.country || undefined,
        phone: invoice.user.phone,
        email: invoice.user.email,
        vatNumber: (invoice.user as any).vatNumber,
        homepage: (invoice.user as any).homepage,
      },
    });

    // Send email with PDF attachment
    await this.emailService.sendInvoiceEmail(
      sendInvoiceDto.recipientEmail,
      sendInvoiceDto.subject,
      sendInvoiceDto.body,
      pdfBuffer,
      invoice.invoiceNumber,
      sendInvoiceDto.sendCopyToSelf,
      currentUser.email,
    );

    // Update invoice status to SENT
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.SENT,
      },
      include: {
        items: true,
        client: true,
        user: true,
      },
    });

    return {
      message: 'Invoice sent successfully',
      invoice: updatedInvoice,
    };
  }
}
