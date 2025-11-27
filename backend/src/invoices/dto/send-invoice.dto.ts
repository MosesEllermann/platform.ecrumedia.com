export class SendInvoiceDto {
  recipientEmail: string;
  subject: string;
  body: string;
  sendCopyToSelf?: boolean;
}
