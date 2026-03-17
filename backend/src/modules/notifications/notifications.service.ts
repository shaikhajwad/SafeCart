import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationLog,
  NotificationChannel,
  NotificationStatus,
} from './entities/notification-log.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
  ) {}

  async send(
    channel: NotificationChannel,
    recipient: string,
    templateKey: string,
    payload: Record<string, unknown>,
    userId?: string,
  ): Promise<void> {
    const log = this.logRepo.create({
      userId: userId || null,
      channel,
      recipient,
      templateKey,
      status: NotificationStatus.QUEUED,
      payload,
    });

    try {
      await this.deliver(channel, recipient, templateKey, payload);
      log.status = NotificationStatus.SENT;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      this.logger.error(`Notification failed for ${recipient} via ${channel}: ${message}`);
      log.status = NotificationStatus.FAILED;
      log.errorMessage = message;
    } finally {
      await this.logRepo.save(log);
    }
  }

  private async deliver(
    channel: NotificationChannel,
    recipient: string,
    templateKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // Integration boundary: each channel needs its own provider
    switch (channel) {
      case NotificationChannel.SMS:
        // TODO: integrate with SMS provider (same as OTP SMS)
        this.logger.warn(`[SMS STUB] To: ${recipient} | Template: ${templateKey}`);
        break;
      case NotificationChannel.EMAIL:
        // TODO: integrate with email provider (e.g., SendGrid, SES)
        this.logger.warn(`[EMAIL STUB] To: ${recipient} | Template: ${templateKey}`);
        break;
      case NotificationChannel.IN_APP:
        // In-app notifications are stored in DB and polled by frontend
        this.logger.log(`[IN_APP] To: ${recipient} | Template: ${templateKey}`);
        break;
    }
  }
}
