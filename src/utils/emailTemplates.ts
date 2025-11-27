interface EmailTemplateParams {
  invoiceNumber: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  total: number;
  isReverseCharge: boolean;
}

export function generateInvoiceEmailTemplate({
  invoiceNumber,
  servicePeriodStart,
  servicePeriodEnd,
  total,
  isReverseCharge,
}: EmailTemplateParams) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatServicePeriod = () => {
    if (!servicePeriodStart || !servicePeriodEnd) {
      return '';
    }
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return `${formatDate(servicePeriodStart)} - ${formatDate(servicePeriodEnd)}`;
  };

  const servicePeriod = formatServicePeriod();
  const amount = formatCurrency(total);

  if (isReverseCharge) {
    return {
      subject: `Rechnung ${invoiceNumber}${servicePeriod ? ` - ${servicePeriod}` : ''}`,
      body: `Guten Tag,

Im Anhang dieser Mail sende ich die Rechnung Nr. ${invoiceNumber}${servicePeriod ? ` für den Zeitraum ${servicePeriod}` : ''} in Höhe von ${amount} ohne Ust.
(Reverse Charge System).

Bei offenen Fragen stehe ich jederzeit zur Verfügung.

Mit freundlichen Grüßen,
Seth-Moses Ellermann`,
    };
  }

  return {
    subject: `Rechnung ${invoiceNumber}${servicePeriod ? ` - ${servicePeriod}` : ''}`,
    body: `Guten Tag,

Im Anhang dieser Mail sende ich die Rechnung Nr. ${invoiceNumber}${servicePeriod ? ` für den Zeitraum ${servicePeriod}` : ''} in Höhe von ${amount}.

Bei offenen Fragen stehe ich jederzeit zur Verfügung.

Mit freundlichen Grüßen,
Seth-Moses Ellermann`,
  };
}
