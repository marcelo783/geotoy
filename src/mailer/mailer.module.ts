// src/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailConfigService } from './email-config.service';
import { EmailConfigController } from './email-config.controller';
import { MailerService } from './mailer.service';
import { EmailConfig } from './entity/email-config.entity';


@Module({
  imports: [TypeOrmModule.forFeature([EmailConfig])],
  providers: [EmailConfigService, MailerService],
  controllers: [EmailConfigController],
  exports: [MailerService, EmailConfigService],
})
export class MailerModule {}
