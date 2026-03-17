import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: configService.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: {
          user: configService.get<string>('SMTP_USER'),
          pass: configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async send(to: string, subject: string, html: string): Promise<{ messageId: string }> {
    if (!this.transporter) {
      this.logger.warn(`Email not configured. Would send to ${to}: ${subject}`);
      return { messageId: 'dev-mock-' + Date.now() };
    }

    const info = await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? '"SafeCart" <noreply@safecart.com>',
      to,
      subject,
      html,
    });

    return { messageId: info.messageId as string };
  }
}
