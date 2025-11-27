import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    // Get email configuration from environment variables
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false), // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    // For development, you can use a test account
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      this.logger.warn('SMTP credentials not configured. Email sending will be simulated.');
      // In development, you might want to use ethereal email for testing
      // You can create test accounts at https://ethereal.email/
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP connection failed:', error);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  async sendInvoiceEmail(
    recipientEmail: string,
    subject: string,
    body: string,
    pdfBuffer: Buffer,
    invoiceNumber: string,
    sendCopyToSelf?: boolean,
    senderEmail?: string,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Email not sent (Development mode).');
      this.logger.log(`Would send email to: ${recipientEmail}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Body: ${body}`);
      this.logger.log(`PDF size: ${pdfBuffer.length} bytes`);
      
      // In development mode, we still return true to allow testing
      // In production, you should throw an error here
      return true;
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@ecrumedia.com'),
        to: recipientEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
        attachments: [
          {
            filename: `Rechnung_${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      // Send to recipient
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Invoice email sent to ${recipientEmail}`);

      // Send copy to self if requested
      if (sendCopyToSelf && senderEmail) {
        await this.transporter.sendMail({
          ...mailOptions,
          to: senderEmail,
          subject: `[Kopie] ${subject}`,
        });
        this.logger.log(`Copy sent to ${senderEmail}`);
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw new Error(`Failed to send invoice email: ${error.message}`);
    }
  }

  async sendQuoteEmail(options: {
    to: string;
    subject: string;
    body: string;
    pdfBuffer: Buffer;
    quoteNumber: string;
    sendCopyToSelf?: boolean;
    senderEmail?: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Email not sent (Development mode).');
      this.logger.log(`Would send quote email to: ${options.to}`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log(`PDF size: ${options.pdfBuffer.length} bytes`);
      return true;
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@ecrumedia.com'),
        to: options.to,
        subject: options.subject,
        text: options.body,
        html: options.body.replace(/\n/g, '<br>'),
        attachments: [
          {
            filename: `Angebot_${options.quoteNumber}.pdf`,
            content: options.pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      // Send to recipient
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Quote email sent to ${options.to}`);

      // Send copy to self if requested
      if (options.sendCopyToSelf && options.senderEmail) {
        await this.transporter.sendMail({
          ...mailOptions,
          to: options.senderEmail,
          subject: `[Kopie] ${options.subject}`,
        });
        this.logger.log(`Copy sent to ${options.senderEmail}`);
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to send quote email:', error);
      throw new Error(`Failed to send quote email: ${error.message}`);
    }
  }
}
