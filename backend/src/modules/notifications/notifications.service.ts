import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';

export interface SendNotificationOptions {
  userId?: string;
  channel: 'sms' | 'email';
  type: string;
  recipient: string;
  subject?: string;
  content: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    private smsProvider: SmsProvider,
    private emailProvider: EmailProvider,
  ) {}

  async send(opts: SendNotificationOptions): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId: opts.userId,
      channel: opts.channel,
      type: opts.type,
      recipient: opts.recipient,
      content: opts.content,
      status: 'pending',
    });
    await this.notificationRepo.save(notification);

    try {
      let messageId: string;
      if (opts.channel === 'sms') {
        const result = await this.smsProvider.send(opts.recipient, opts.content);
        messageId = result.messageId;
      } else {
        const result = await this.emailProvider.send(
          opts.recipient,
          opts.subject ?? 'SafeCart Notification',
          opts.content,
        );
        messageId = result.messageId;
      }

      notification.status = 'sent';
      notification.providerMessageId = messageId;
    } catch (err) {
      this.logger.error(`Failed to send ${opts.channel} to ${opts.recipient}`, err);
      notification.status = 'failed';
      notification.errorMessage = err instanceof Error ? err.message : String(err);
    }

    return this.notificationRepo.save(notification);
  }

  async sendOrderConfirmation(
    buyerPhone: string,
    orderRef: string,
  ): Promise<void> {
    await this.send({
      channel: 'sms',
      type: 'order_created',
      recipient: buyerPhone,
      content: `SafeCart: Your order ${orderRef} has been placed. Track at safecart.com/orders/${orderRef}`,
    });
  }

  async sendOtpNotification(phone: string, otp: string): Promise<void> {
    await this.send({
      channel: 'sms',
      type: 'otp',
      recipient: phone,
      content: `Your SafeCart OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
    });
  }
}
