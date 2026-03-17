import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationsService, SmsProvider, EmailProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
