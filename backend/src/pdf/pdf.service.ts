import { Injectable, Logger } from '@nestjs/common';
import jsPDF from 'jspdf';

interface InvoiceItem {
  productName?: string;
  description: string;
  quantity: number;
  unitName?: string;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
}

interface Client {
  clientNumber: number;
  name: string;
  type: 'COMPANY' | 'PRIVATE';
  vatNumber?: string;
  address?: string;
  countryCode: string;
  phone?: string;
  email?: string;
}

interface User {
  firstName: string;
  lastName: string;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string;
  phone?: string | null;
  email: string;
  vatNumber?: string | null;
  homepage?: string | null;
}

interface GeneratePDFOptions {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  servicePeriodStart?: Date;
  servicePeriodEnd?: Date;
  client: Client;
  items: InvoiceItem[];
  isReverseCharge: boolean;
  notes?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  user?: User;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateInvoicePDF(options: GeneratePDFOptions): Promise<Buffer> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      const renderMultilineText = (
        value: string,
        x: number,
        y: number,
        {
          align = 'left',
          maxWidth,
          lineHeight = 5,
        }: { align?: 'left' | 'right'; maxWidth?: number; lineHeight?: number } = {},
      ) => {
        const segments = value.split(/\r?\n/);
        let currentY = y;
        segments.forEach((segment) => {
          const normalized = segment ?? '';
          if (normalized.length === 0) {
            currentY += lineHeight;
            return;
          }
          const lines =
            maxWidth !== undefined && maxWidth > 0 ? pdf.splitTextToSize(normalized, maxWidth) : [normalized];
          const textOptions = align === 'right' ? { align: 'right' as const } : undefined;
          lines.forEach((line: string) => {
            pdf.text(line, x, currentY, textOptions);
            currentY += lineHeight;
          });
        });
        return currentY;
      };

      // Helper functions
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);
      };

      const formatDate = (date: Date) => {
        // Format the date in Vienna timezone using Intl.DateTimeFormat
        return new Intl.DateTimeFormat('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Europe/Vienna',
        }).format(date);
      };

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECHNUNG', margin, yPos);
      yPos += 15;

      // Invoice details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Rechnungsnummer: ${options.invoiceNumber}`, margin, yPos);
      yPos += 6;
      pdf.text(`Datum: ${formatDate(options.invoiceDate)}`, margin, yPos);
      yPos += 6;
      pdf.text(`Fällig am: ${formatDate(options.dueDate)}`, margin, yPos);
      yPos += 6;

      if (options.servicePeriodStart && options.servicePeriodEnd) {
        pdf.text(
          `Leistungszeitraum: ${formatDate(options.servicePeriodStart)} - ${formatDate(options.servicePeriodEnd)}`,
          margin,
          yPos,
        );
        yPos += 6;
      }

      yPos += 10;

      // Sender info (top left)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const senderName = options.user?.company || 'Seth-Moses Ellermann e.U.';
      pdf.text(senderName, margin, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'normal');
      if (options.user?.address) {
        yPos = renderMultilineText(options.user.address, margin, yPos, {
          maxWidth: pageWidth - 2 * margin,
          lineHeight: 4,
        });
      }
      if (options.user?.postalCode && options.user?.city) {
        pdf.text(`${options.user.postalCode} ${options.user.city}`, margin, yPos);
        yPos += 4;
      }
      if (options.user?.vatNumber) {
        pdf.text(`UID: ${options.user.vatNumber}`, margin, yPos);
        yPos += 4;
      }

      yPos += 10;

      // Client info
      pdf.setFont('helvetica', 'bold');
      pdf.text('Empfänger:', margin, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.text(options.client.name, margin, yPos);
      yPos += 5;

      if (options.client.address) {
        yPos = renderMultilineText(options.client.address, margin, yPos, {
          maxWidth: 80,
          lineHeight: 5,
        });
      }

      if (options.client.vatNumber) {
        pdf.text(`UID: ${options.client.vatNumber}`, margin, yPos);
        yPos += 5;
      }

      yPos += 15;

      // Items table header
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(239, 246, 255); // Light blue background
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');

      pdf.text('Beschreibung', margin + 2, yPos);
      pdf.text('Menge', pageWidth - margin - 60, yPos, { align: 'right' });
      pdf.text('Preis', pageWidth - margin - 40, yPos, { align: 'right' });
      pdf.text('Betrag', pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;

      // Items
      pdf.setFont('helvetica', 'normal');
      options.items.forEach((item) => {
        const quantity = item.quantity;
        const unitName = item.unitName || '';
        const unitPrice = item.unitPrice;
        const discount = item.discount || 0;
        
        // Calculate item total with discount applied
        const lineTotal = quantity * unitPrice;
        const discountAmount = (lineTotal * discount) / 100;
        const itemTotal = lineTotal - discountAmount;

        // Description (with product name if available)
        const description = item.productName
          ? `${item.productName}\n${item.description}`
          : item.description;

        const descLines = pdf.splitTextToSize(description, 90);
        descLines.forEach((line: string, index: number) => {
          pdf.text(line, margin + 2, yPos + index * 5);
        });

        const lineHeight = descLines.length * 5;

        // Quantity
        pdf.text(`${quantity} ${unitName}`, pageWidth - margin - 60, yPos, { align: 'right' });

        // Unit price (show with discount if applicable)
        if (discount > 0) {
          pdf.text(formatCurrency(unitPrice), pageWidth - margin - 40, yPos, { align: 'right' });
          pdf.setFontSize(8);
          pdf.text(`${discount.toFixed(2)}%`, pageWidth - margin - 40, yPos + 3, { align: 'right' });
          pdf.setFontSize(10);
        } else {
          pdf.text(formatCurrency(unitPrice), pageWidth - margin - 40, yPos, { align: 'right' });
        }

        // Total
        pdf.text(formatCurrency(itemTotal), pageWidth - margin - 2, yPos, { align: 'right' });

        yPos += lineHeight + 3;
      });

      yPos += 10;

      // Totals
      pdf.setFont('helvetica', 'normal');
      pdf.text('Zwischensumme:', pageWidth - margin - 60, yPos);
      pdf.text(formatCurrency(options.subtotal), pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 6;

      if (options.isReverseCharge) {
        pdf.setFontSize(8);
        pdf.text('(Reverse Charge - Steuerschuldnerschaft des Leistungsempfängers)', pageWidth - margin - 60, yPos);
        yPos += 6;
        pdf.setFontSize(10);
      } else {
        pdf.text('MwSt.:', pageWidth - margin - 60, yPos);
        pdf.text(formatCurrency(options.taxAmount), pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 6;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Gesamtbetrag:', pageWidth - margin - 60, yPos);
      pdf.text(formatCurrency(options.total), pageWidth - margin - 2, yPos, { align: 'right' });

      yPos += 15;

      // Notes
      if (options.notes) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const noteLines = pdf.splitTextToSize(options.notes, pageWidth - 2 * margin);
        noteLines.forEach((line: string) => {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 4;
        });
      }

      // Return PDF as buffer
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      return pdfBuffer;
    } catch (error) {
      this.logger.error('Failed to generate PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }

  async generateQuotePDF(options: any): Promise<Buffer> {
    try {
      // For now, reuse the invoice PDF generation with "ANGEBOT" title
      // This can be customized later
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      const renderMultilineText = (
        value: string,
        x: number,
        y: number,
        {
          align = 'left',
          maxWidth,
          lineHeight = 5,
        }: { align?: 'left' | 'right'; maxWidth?: number; lineHeight?: number } = {},
      ) => {
        const segments = value.split(/\r?\n/);
        let currentY = y;
        segments.forEach((segment) => {
          const normalized = segment ?? '';
          if (normalized.length === 0) {
            currentY += lineHeight;
            return;
          }
          const lines =
            maxWidth !== undefined && maxWidth > 0 ? pdf.splitTextToSize(normalized, maxWidth) : [normalized];
          const textOptions = align === 'right' ? { align: 'right' as const } : undefined;
          lines.forEach((line: string) => {
            pdf.text(line, x, currentY, textOptions);
            currentY += lineHeight;
          });
        });
        return currentY;
      };

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);
      };

      const formatDate = (dateStr: string | Date) => {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        // Format the date in Vienna timezone using Intl.DateTimeFormat
        return new Intl.DateTimeFormat('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Europe/Vienna',
        }).format(date);
      };

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANGEBOT', margin, yPos);
      yPos += 15;

      // Quote details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Angebotsnummer: ${options.quoteNumber}`, margin, yPos);
      yPos += 6;
      pdf.text(`Datum: ${formatDate(options.issueDate)}`, margin, yPos);
      yPos += 6;
      pdf.text(`Gültig bis: ${formatDate(options.validUntil)}`, margin, yPos);
      yPos += 15;

      // Client information
      pdf.setFont('helvetica', 'bold');
      pdf.text('Kunde:', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(options.client.name, margin, yPos);
      yPos += 5;

      if (options.client.address) {
        yPos = renderMultilineText(options.client.address, margin, yPos, {
          maxWidth: 80,
          lineHeight: 5,
        });
      }

      yPos += 10;

      // Items table header
      pdf.setFont('helvetica', 'bold');
      pdf.text('Beschreibung', margin, yPos);
      pdf.text('Menge', pageWidth - 80, yPos);
      pdf.text('Preis', pageWidth - 60, yPos);
      pdf.text('Gesamt', pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      // Items
      pdf.setFont('helvetica', 'normal');
      options.items.forEach((item: any) => {
        const total = item.quantity * item.unitPrice;
        pdf.text(item.description, margin, yPos);
        pdf.text(item.quantity.toString(), pageWidth - 80, yPos);
        pdf.text(formatCurrency(item.unitPrice), pageWidth - 60, yPos);
        pdf.text(formatCurrency(total), pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      });

      yPos += 10;

      // Totals
      pdf.setFont('helvetica', 'bold');
      pdf.text('Zwischensumme:', pageWidth - 80, yPos);
      pdf.text(formatCurrency(options.subtotal), pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;

      if (!options.isReverseCharge) {
        pdf.text('MwSt:', pageWidth - 80, yPos);
        pdf.text(formatCurrency(options.taxAmount), pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      }

      pdf.text('Gesamt:', pageWidth - 80, yPos);
      pdf.text(formatCurrency(options.total), pageWidth - margin, yPos, { align: 'right' });

      // Return PDF as buffer
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      return pdfBuffer;
    } catch (error) {
      this.logger.error('Failed to generate quote PDF:', error);
      throw new Error('Failed to generate quote PDF');
    }
  }
}
