export class SendQuoteDto {
  recipientEmail: string;
  subject: string;
  body: string;
  sendCopyToSelf?: boolean;
}
