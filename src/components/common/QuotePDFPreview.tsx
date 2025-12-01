import { forwardRef, useImperativeHandle } from 'react';
import jsPDF from 'jspdf';
import { addOutfitFont, setFont } from '../../utils/pdfFonts';

interface QuoteItem {
  productName: string;
  description: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  netAmount: number;
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
  client?: {
    name: string;
    vatNumber?: string | null;
  } | null;
}

interface QuotePDFPreviewProps {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  client: Client;
  items: QuoteItem[];
  globalDiscount: number;
  isReverseCharge: boolean;
  notes: string;
  conditions: string;
  user?: User;
}

export interface QuotePDFPreviewRef {
  generatePDF: () => Promise<void>;
  downloadPDF: () => Promise<void>;
}

const QuotePDFPreview = forwardRef<QuotePDFPreviewRef, QuotePDFPreviewProps>(
  (
    {
      quoteNumber,
      quoteDate,
      validUntil,
      servicePeriodStart,
      servicePeriodEnd,
      client,
      items,
      globalDiscount,
      isReverseCharge,
      notes,
      conditions,
      user,
    },
    ref
  ) => {
    // Function to convert image to base64
    const getLogoAsBase64 = async (): Promise<string | null> => {
      try {
        const response = await fetch('/images/logo/ecru media logo black invoice.png');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn('Could not load logo:', error);
        return null;
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      // Parse the date string as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const calculateSubtotalBeforeDiscount = () => {
      return items.reduce((sum, item) => sum + item.netAmount, 0);
    };

    const calculateGlobalDiscountAmount = () => {
      return calculateSubtotalBeforeDiscount() * (globalDiscount / 100);
    };

    const calculateSubtotal = () => {
      const itemsTotal = items.reduce((sum, item) => sum + item.netAmount, 0);
      const discountMultiplier = 1 - globalDiscount / 100;
      return itemsTotal * discountMultiplier;
    };

    const calculateTax = () => {
      if (isReverseCharge) return 0;
      return calculateSubtotal() * 0.2; // 20% Austrian VAT
    };

    const calculateTotal = () => {
      return calculateSubtotal() + calculateTax();
    };

    const createQuotePDF = async () => {
      const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 20;
          const contentWidth = pageWidth - 2 * margin;
          const footerHeight = 35; // Space reserved for footer
          const footerStartY = pageHeight - footerHeight;
          let yPos = margin;
          let currentPage = 1;

          // Define colors
          const primaryBlue: [number, number, number] = [96, 165, 250]; // #60a5fa
          const darkGray: [number, number, number] = [17, 24, 39]; // #111827
          const mediumGray: [number, number, number] = [107, 114, 128]; // #6b7280
          const lightBlue: [number, number, number] = [239, 246, 255]; // #eff6ff

          // Helper function to add text with proper encoding
          const addText = (text: string, x: number, y: number, options?: any) => {
            pdf.text(text, x, y, options);
          };

          // Helper function to check if we need a new page
          const needsNewPage = (requiredSpace: number): boolean => {
            return yPos + requiredSpace > footerStartY;
          };

          // Helper function to add a new page
          const addNewPage = () => {
            pdf.addPage();
            currentPage++;
            yPos = margin;
          };

          const renderMultilineText = (
            value: string,
            x: number,
            y: number,
            {
              align = 'left',
              maxWidth,
              lineHeight = 4,
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
                addText(line, x, currentY, textOptions);
                currentY += lineHeight;
              });
            });
            return currentY;
          };

          // Helper function to render footer on any page
          const renderFooter = (pageNum: number, totalPages: number) => {
            const footerY = pageHeight - 30;
            pdf.setDrawColor(229, 231, 235);
            pdf.setLineWidth(0.3);
            pdf.line(margin, footerY, pageWidth - margin, footerY);
            
            // Footer - Left side: Company info
            pdf.setFontSize(8);
            setFont(pdf, 'bold');
            pdf.setTextColor(31, 41, 55);
            const footerCompanyName = user?.company || 'Seth-Moses Ellermann e.U.';
            addText(footerCompanyName, margin, footerY + 5);
            
            setFont(pdf, 'normal');
            pdf.setTextColor(...mediumGray);
            const footerAddress = user?.address || 'Pfauengasse 8/22, 1060 Wien, Österreich';
            const footerAddressLines = pdf.splitTextToSize(footerAddress, 80);
            let footerLineY = footerY + 9;
            footerAddressLines.forEach((line: string) => {
              addText(line, margin, footerLineY);
              footerLineY += 3;
            });
            const footerUID = user?.vatNumber || 'ATU76436714';
            addText(`UID-Nummer: ${footerUID}`, margin, footerLineY);

            // Footer - Center: Page numbers
            setFont(pdf, 'normal');
            pdf.setTextColor(...mediumGray);
            pdf.setFontSize(8);
            addText(`Seite ${pageNum} von ${totalPages}`, pageWidth / 2, footerY + 5, { align: 'center' });

            // Footer - Right side: Bankverbindung
            setFont(pdf, 'bold');
            pdf.setTextColor(31, 41, 55);
            addText('Bankverbindung', pageWidth - margin, footerY + 5, { align: 'right' });
            
            setFont(pdf, 'normal');
            pdf.setTextColor(...mediumGray);
            const footerContactName = user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : 'Seth-Moses Ellermann';
            addText(footerContactName, pageWidth - margin, footerY + 9, { align: 'right' });
            addText('IBAN: DE37100110012623755446', pageWidth - margin, footerY + 12, { align: 'right' });
            addText('BIC: NTSBDEB1XXX', pageWidth - margin, footerY + 15, { align: 'right' });
          };

          // Add Outfit font (or fallback to Helvetica)
          try {
            addOutfitFont(pdf);
            console.log('✅ Outfit font loaded successfully');
          } catch (error) {
            console.warn('⚠️ Could not load Outfit font, using Helvetica:', error);
            pdf.setFont('helvetica', 'normal');
          }

          // Try to add logo
          let logoAdded = false;
          try {
            const logoBase64 = await getLogoAsBase64();
            if (logoBase64) {
              // Add logo (PNG format, 700x150px = 4.67:1 ratio) - LARGER SIZE
              const logoWidth = 45; // Increased from 35 to 45 mm
              const logoHeight = logoWidth / 4.67; // maintain aspect ratio
              pdf.addImage(logoBase64, 'PNG', margin, yPos - 2, logoWidth, logoHeight);
              yPos += logoHeight + 2;
              logoAdded = true;
            }
          } catch (error) {
            console.warn('Could not add logo to PDF:', error);
          }

          // Only show "ECRU MEDIA" text if logo wasn't added
          if (!logoAdded) {
            pdf.setFontSize(18);
            setFont(pdf, 'bold');
            pdf.setTextColor(...darkGray);
            addText('ECRU MEDIA', margin, yPos);
            yPos += 3;
          }

          // Header Section with better styling
          
          yPos += 10;
          pdf.setFontSize(22);
          setFont(pdf, 'bold');
          addText('Angebot', margin, yPos);
          
          pdf.setFontSize(10);
          setFont(pdf, 'normal');
          pdf.setTextColor(...mediumGray);
          addText(`Nr. ${quoteNumber}`, margin, yPos + 6);

          // Sender info (right side)
          pdf.setFontSize(10);
          setFont(pdf, 'bold');
          pdf.setTextColor(...darkGray);
          const senderName = user?.company || 'Seth-Moses Ellermann e.U.';
          addText(senderName, pageWidth - margin, yPos - 10, { align: 'right' });
          
          setFont(pdf, 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(...mediumGray);
          
          // Split address into multiple lines if needed (max width 80mm)
          const senderAddress = user?.address || 'Pfauengasse 8/22, 1060 Wien, Österreich';
          let currentY = yPos - 5;
          currentY = renderMultilineText(senderAddress, pageWidth - margin, currentY, {
            align: 'right',
            maxWidth: 80,
          });
          
          // Continue with UID, phone, email after address
          const senderUID = user?.vatNumber || 'ATU76436714';
          const senderPhone = user?.phone || '+43 677 61685632';
          const senderEmail = user?.email || 'servus@ecrumedia.at';
          addText(`UID: ${senderUID}`, pageWidth - margin, currentY, { align: 'right' });
          addText(`Tel: ${senderPhone}`, pageWidth - margin, currentY + 4, { align: 'right' });
          addText(senderEmail, pageWidth - margin, currentY + 8, { align: 'right' });

          // Small spacing after sender info block
          yPos += 18;
          
          // Separator line
          pdf.setDrawColor(229, 231, 235);
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 10;

          // Client Information (NO CARD)
          pdf.setFontSize(8);
          setFont(pdf, 'bold');
          pdf.setTextColor(...darkGray);
          addText('ANGEBOTSEMPFÄNGER', margin, yPos);
          yPos += 7; // Increased from 5 to 7 for more spacing
          
          pdf.setFontSize(12);
          setFont(pdf, 'bold');
          pdf.setTextColor(...darkGray);
          addText(client.name, margin, yPos);
          yPos += 5;
          
          pdf.setFontSize(9);
          setFont(pdf, 'normal');
          pdf.setTextColor(...mediumGray);
          if (client.address) {
            yPos = renderMultilineText(client.address, margin, yPos, {
              maxWidth: contentWidth,
            });
          }
          if (client.vatNumber) {
            addText(`UID: ${client.vatNumber}`, margin, yPos);
            yPos += 4;
          }
          if (client.email) {
            addText(client.email, margin, yPos);
            yPos += 4;
          }
          if (client.phone) {
            addText(`☎ ${client.phone}`, margin, yPos);
            yPos += 4;
          }

          yPos += 4; // Reduced from 8 to 4

          // Quote Details Boxes with rounded corners (NO BORDERS OR SHADOWS) - MORE PADDING
          const boxWidth = (contentWidth - 10) / 3;
          const boxHeight = 18; // Increased from 16 to 18 for more vertical padding
          const boxPaddingLeft = 5; // Increased left padding
          const borderRadius = 3;
          
          // Draw rounded boxes with light blue background (no borders)
          pdf.setFillColor(...lightBlue);
          pdf.roundedRect(margin, yPos, boxWidth, boxHeight, borderRadius, borderRadius, 'F');
          pdf.roundedRect(margin + boxWidth + 5, yPos, boxWidth, boxHeight, borderRadius, borderRadius, 'F');
          if (servicePeriodStart && servicePeriodEnd) {
            pdf.roundedRect(margin + 2 * boxWidth + 10, yPos, boxWidth, boxHeight, borderRadius, borderRadius, 'F');
          }

          pdf.setFontSize(8);
          setFont(pdf, 'bold');
          pdf.setTextColor(...primaryBlue);
          addText('ANGEBOTSDATUM', margin + boxPaddingLeft, yPos + 6);
          addText('GÜLTIG BIS', margin + boxWidth + 5 + boxPaddingLeft, yPos + 6);
          if (servicePeriodStart && servicePeriodEnd) {
            addText('LEISTUNGSZEITRAUM', margin + 2 * boxWidth + 10 + boxPaddingLeft, yPos + 6);
          }

          pdf.setFontSize(10);
          setFont(pdf, 'bold');
          pdf.setTextColor(...darkGray);
          addText(formatDate(quoteDate), margin + boxPaddingLeft, yPos + 13.5);
          addText(formatDate(validUntil), margin + boxWidth + 5 + boxPaddingLeft, yPos + 13.5);
          if (servicePeriodStart && servicePeriodEnd) {
            addText(`${formatDate(servicePeriodStart)} - ${formatDate(servicePeriodEnd)}`, margin + 2 * boxWidth + 10 + boxPaddingLeft, yPos + 13.5);
          }

          yPos += boxHeight + 5;

          // ===== MANUAL TABLE RENDERING WITH PAGE BREAKS =====
          const tableHeaders = ['Pos.', 'Beschreibung', 'Menge', 'Einheit', 'Einzelpreis'];
          const hasDiscounts = items.some((item) => item.discount > 0);
          if (hasDiscounts) {
            tableHeaders.push('Rabatt');
          }
          if (!isReverseCharge) {
            tableHeaders.push('USt.');
          }
          tableHeaders.push('Gesamt');

          // Calculate column widths
          // For quotes, give more space to description column by reducing other columns
          const colWidths = [10, 0, 14, 16, 20]; // 0 for auto-width description (further reduced for wider description)
          if (hasDiscounts && !isReverseCharge) {
            colWidths.push(14, 11, 22); // Rabatt, USt., Gesamt
          } else if (hasDiscounts && isReverseCharge) {
            colWidths.push(14, 22); // Rabatt, Gesamt (no USt.)
          } else if (!hasDiscounts && !isReverseCharge) {
            colWidths.push(11, 22); // USt., Gesamt
          } else {
            colWidths.push(22); // Gesamt only (no discount, no USt.)
          }
          
          // Calculate description column width
          const fixedWidthSum = colWidths.reduce((sum, w) => sum + w, 0) - 0; // subtract the auto column
          colWidths[1] = contentWidth - fixedWidthSum;

          // Draw table header
          const drawTableHeader = () => {
            const headerHeight = 10;
            
            // Header background with rounded corners on ALL pages
            pdf.setFillColor(...primaryBlue);
            const tableStartY = yPos;
            pdf.rect(margin, tableStartY, contentWidth, headerHeight, 'F');
            
            // Round top corners (on every page)
            const radius = 2;
            pdf.setFillColor(255, 255, 255);
            pdf.rect(margin - 1, tableStartY - 1, radius + 1, radius + 1, 'F');
            pdf.setFillColor(...primaryBlue);
            pdf.circle(margin + radius, tableStartY + radius, radius, 'F');
            
            pdf.setFillColor(255, 255, 255);
            pdf.rect(margin + contentWidth - radius, tableStartY - 1, radius + 1, radius + 1, 'F');
            pdf.setFillColor(...primaryBlue);
            pdf.circle(margin + contentWidth - radius, tableStartY + radius, radius, 'F');
            
            // Header text
            pdf.setFontSize(9);
            setFont(pdf, 'bold');
            pdf.setTextColor(255, 255, 255);
            
            let xPos = margin;
            const headerAlignments = ['left', 'left', 'right', 'right', 'right'];
            if (hasDiscounts && !isReverseCharge) {
              headerAlignments.push('right', 'right', 'right'); // Rabatt, USt., Gesamt
            } else if (hasDiscounts && isReverseCharge) {
              headerAlignments.push('right', 'right'); // Rabatt, Gesamt
            } else if (!hasDiscounts && !isReverseCharge) {
              headerAlignments.push('right', 'right'); // USt., Gesamt
            } else {
              headerAlignments.push('right'); // Gesamt only
            }
            
            tableHeaders.forEach((header, idx) => {
              const colWidth = colWidths[idx];
              const align = headerAlignments[idx];
              const textX = align === 'right' ? xPos + colWidth - 2 : xPos + 2;
              addText(header, textX, tableStartY + 6.5, { align: align === 'right' ? 'right' : 'left' });
              xPos += colWidth;
            });
            
            yPos += headerHeight;
          };

          // Draw table header initially
          drawTableHeader();

          // Draw each table row
          items.forEach((item, itemIndex) => {
            const productName = item.productName;
            const description = item.description;
            
            // Split product name into lines if too long
            const productNameLines = pdf.splitTextToSize(productName, colWidths[1] - 8);
            
            // Calculate row height based on content
            const descLines = description ? pdf.splitTextToSize(description, colWidths[1] - 8) : [];
            const productNameHeight = productNameLines.length * 4;
            const descHeight = descLines.length * 4;
            const rowHeight = description ? 12 + productNameHeight + descHeight : 10 + Math.max(0, (productNameLines.length - 1) * 4);
            
            // Check if we need a new page
            if (needsNewPage(rowHeight + 10)) { // +10 for safety margin
              addNewPage();
              drawTableHeader();
            }
            
            // Alternating row colors
            const isEvenRow = itemIndex % 2 === 0;
            if (!isEvenRow) {
              pdf.setFillColor(249, 250, 251);
              pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
            }
            
            // Draw cell content
            let xPos = margin;
            
            // Position number (bold blue)
            pdf.setFontSize(9);
            setFont(pdf, 'bold');
            pdf.setTextColor(...primaryBlue);
            addText((itemIndex + 1).toString(), xPos + 2, yPos + 6);
            xPos += colWidths[0];
            
            // Description (product name + description)
            pdf.setFontSize(10);
            setFont(pdf, 'bold');
            pdf.setTextColor(...darkGray);
            pdf.text(productNameLines, xPos + 2, yPos + 6);
            
            if (description) {
              pdf.setFontSize(9);
              setFont(pdf, 'normal');
              pdf.setTextColor(156, 163, 175);
              pdf.text(descLines, xPos + 2, yPos + 6 + productNameHeight + 1);
            }
            xPos += colWidths[1];
            
            // Quantity
            pdf.setFontSize(9);
            setFont(pdf, 'normal');
            pdf.setTextColor(...darkGray);
            addText(item.quantity.toString(), xPos + colWidths[2] - 2, yPos + 6, { align: 'right' });
            xPos += colWidths[2];
            
            // Unit
            addText(item.unitName, xPos + colWidths[3] - 2, yPos + 6, { align: 'right' });
            xPos += colWidths[3];
            
            // Unit price
            addText(formatCurrency(item.unitPrice), xPos + colWidths[4] - 2, yPos + 6, { align: 'right' });
            xPos += colWidths[4];
            
            // Discount (if applicable)
            if (hasDiscounts) {
              if (item.discount > 0) {
                pdf.setTextColor(249, 115, 22);
                addText(`${item.discount}%`, xPos + colWidths[5] - 2, yPos + 6, { align: 'right' });
              } else {
                pdf.setTextColor(...darkGray);
                addText('-', xPos + colWidths[5] - 2, yPos + 6, { align: 'right' });
              }
              pdf.setTextColor(...darkGray);
              xPos += colWidths[5];
            }
            
            // Tax rate (only if not reverse charge)
            if (!isReverseCharge) {
              addText(`${item.taxRate}%`, xPos + colWidths[hasDiscounts ? 6 : 5] - 2, yPos + 6, { align: 'right' });
              xPos += colWidths[hasDiscounts ? 6 : 5];
            }
            
            // Total (bold)
            setFont(pdf, 'bold');
            const totalColIndex = hasDiscounts ? (isReverseCharge ? 6 : 7) : (isReverseCharge ? 5 : 6);
            addText(formatCurrency(item.netAmount), xPos + colWidths[totalColIndex] - 2, yPos + 6, { align: 'right' });
            
            yPos += rowHeight;
          });

          yPos += 5; // Space after table

          // ===== TOTALS, NOTES, AND CONDITIONS WITH INDIVIDUAL SPACE CHECKING =====
          
          // Calculate required space for totals section
          let numLines = 2; // subtotal + tax
          if (globalDiscount > 0) {
            numLines += 2; // discount + adjusted subtotal
          }
          const lineSpacing = 6;
          const topPadding = 6;
          const bottomPadding = 3;
          const separatorGap = 5;
          const totalSectionHeight = 9;
          const totalsHeight = topPadding + (numLines * lineSpacing) + separatorGap + totalSectionHeight + bottomPadding;
          
          // Check if totals section needs a new page
          if (needsNewPage(totalsHeight + 10)) { // +10 safety margin
            addNewPage();
          }

          // Totals Section - Perfectly balanced spacing
          const totalsX = pageWidth - margin - 85;
          const totalsWidth = 85;
          const horizontalPadding = 6;
          
          // Draw the light blue rounded box
          pdf.setFillColor(...lightBlue);
          pdf.roundedRect(totalsX, yPos, totalsWidth, totalsHeight, 3, 3, 'F');

          // Start content
          yPos += topPadding + 3.5; // Top padding + baseline offset
          pdf.setFontSize(9);
          setFont(pdf, 'normal');
          pdf.setTextColor(...mediumGray);
          
          // First line: Subtotal
          const subtotalLabel = globalDiscount > 0 ? 'Zwischensumme (nach Produktrabatten)' : 'Zwischensumme ohne USt.';
          addText(subtotalLabel, totalsX + horizontalPadding, yPos);
          setFont(pdf, 'bold');
          pdf.setTextColor(...darkGray);
          addText(formatCurrency(globalDiscount > 0 ? calculateSubtotalBeforeDiscount() : calculateSubtotal()), totalsX + totalsWidth - horizontalPadding, yPos, { align: 'right' });
          
          // Optional: Global discount lines
          if (globalDiscount > 0) {
            yPos += lineSpacing;
            setFont(pdf, 'normal');
            pdf.setTextColor(249, 115, 22); // orange
            addText(`Rabatt auf Gesamtbetrag (${globalDiscount}%)`, totalsX + horizontalPadding, yPos);
            setFont(pdf, 'bold');
            addText(`-${formatCurrency(calculateGlobalDiscountAmount())}`, totalsX + totalsWidth - horizontalPadding, yPos, { align: 'right' });
            
            yPos += lineSpacing;
            setFont(pdf, 'normal');
            pdf.setTextColor(...mediumGray);
            addText('Zwischensumme ohne USt.', totalsX + horizontalPadding, yPos);
            setFont(pdf, 'bold');
            pdf.setTextColor(...darkGray);
            addText(formatCurrency(calculateSubtotal()), totalsX + totalsWidth - horizontalPadding, yPos, { align: 'right' });
          }

          // Tax line
          yPos += lineSpacing;
          if (!isReverseCharge) {
            setFont(pdf, 'normal');
            pdf.setTextColor(...mediumGray);
            addText('Mehrwertsteuer (20%)', totalsX + horizontalPadding, yPos);
            setFont(pdf, 'bold');
            pdf.setTextColor(...darkGray);
            addText(formatCurrency(calculateTax()), totalsX + totalsWidth - horizontalPadding, yPos, { align: 'right' });
          } else {
            setFont(pdf, 'bold');
            pdf.setTextColor(...primaryBlue);
            pdf.setFontSize(8);
            addText('Reverse Charge', totalsX + horizontalPadding, yPos);
            addText('0,00 €', totalsX + totalsWidth - horizontalPadding, yPos, { align: 'right' });
          }

          // Subtle gray separator line
          yPos += 3.5;
          pdf.setDrawColor(209, 213, 219);
          pdf.setLineWidth(0.3);
          pdf.line(totalsX + horizontalPadding, yPos, totalsX + totalsWidth - horizontalPadding, yPos);
          
          // Total amount
          yPos += 7.5;
          pdf.setFontSize(11);
          setFont(pdf, 'bold');
          pdf.setTextColor(...darkGray);
          addText('Gesamtbetrag EUR', totalsX + horizontalPadding, yPos);
          pdf.setFontSize(14);
          pdf.setTextColor(...primaryBlue);
          addText(formatCurrency(calculateTotal()), totalsX + totalsWidth - horizontalPadding, yPos, { align: 'right' });

          yPos += 15;

          // Notes Section with neutral gray background
          if (notes) {
            // Calculate required space for notes
            const notesLines = pdf.splitTextToSize(notes, contentWidth - 8);
            const notesHeight = 8 + notesLines.length * 4 + 5; // +5 for spacing before
            
            // Check if notes alone would overflow
            if (needsNewPage(notesHeight)) {
              addNewPage();
            }
            
            yPos += 5;
            
            // Light gray background
            pdf.setFillColor(249, 250, 251);
            pdf.roundedRect(margin, yPos, contentWidth, notesHeight - 5, 2, 2, 'F');
            
            // Thin left accent line
            pdf.setDrawColor(209, 213, 219);
            pdf.setLineWidth(0.8);
            pdf.line(margin, yPos, margin, yPos + notesHeight - 5);
            
            yPos += 5;
            pdf.setFontSize(8);
            setFont(pdf, 'bold');
            pdf.setTextColor(107, 114, 128);
            addText('ANMERKUNGEN', margin + 5, yPos);
            
            yPos += 4;
            pdf.setFontSize(9);
            setFont(pdf, 'normal');
            pdf.setTextColor(55, 65, 81);
            pdf.text(notesLines, margin + 5, yPos);
            yPos += notesLines.length * 4 + 3;
          }

          // Payment Conditions
          if (conditions) {
            // Calculate required space for conditions
            const conditionsLines = pdf.splitTextToSize(conditions, contentWidth);
            const conditionsHeight = 5 + 5 + conditionsLines.length * 4; // title + spacing + lines
            
            // Check if conditions alone would overflow
            if (needsNewPage(conditionsHeight)) {
              addNewPage();
            }
            
            yPos += 5;
            pdf.setFontSize(9);
            setFont(pdf, 'bold');
            pdf.setTextColor(...darkGray);
            addText('ANGEBOTSBEDINGUNGEN', margin, yPos);
            
            yPos += 5;
            pdf.setFontSize(9);
            setFont(pdf, 'normal');
            pdf.setTextColor(55, 65, 81);
            pdf.text(conditionsLines, margin, yPos);
            yPos += conditionsLines.length * 4;
          }

          // ===== ADD FOOTERS TO ALL PAGES =====
          const totalPages = pdf.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            renderFooter(i, totalPages);
          }

          return pdf;
    };

    useImperativeHandle(ref, () => ({
      generatePDF: async () => {
        try {
          const pdf = await createQuotePDF();
          
          // Open PDF in new tab instead of downloading
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
          
          // Clean up the URL after a short delay to allow the browser to open it
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
        } catch (error) {
          console.error('Fehler beim Generieren des PDFs:', error);
          alert('Es gab einen Fehler beim Erstellen des PDFs. Bitte versuchen Sie es erneut.');
        }
      },
      downloadPDF: async () => {
        try {
          const pdf = await createQuotePDF();
          
          // Download PDF
          pdf.save(`Angebot_${quoteNumber}.pdf`);
        } catch (error) {
          console.error('Fehler beim Generieren des PDFs:', error);
          alert('Es gab einen Fehler beim Erstellen des PDFs. Bitte versuchen Sie es erneut.');
        }
      },
    }));

    return null; // No HTML preview needed anymore
  }
);

QuotePDFPreview.displayName = 'QuotePDFPreview';

export default QuotePDFPreview;
