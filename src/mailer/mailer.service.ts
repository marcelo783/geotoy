import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailerService {
  private mg;
  private domain: string;
  private from: string;
  private logger = new Logger(MailerService.name);

  constructor() {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY!,
    });
    this.domain = process.env.MAILGUN_DOMAIN!;
    this.from = process.env.MAILGUN_FROM!;
  }

  async sendEmailWithImages(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; path: string; cid?: string }[],
  ) {
    try {
      const formattedAttachments =
        attachments?.map((a) => ({
          filename: a.filename,
          data: fs.createReadStream(path.resolve(a.path)),
          cid: a.cid,
        })) ?? [];

      const data: any = {
        from: this.from,
        to,
        subject,
        html,
      };

      if (formattedAttachments.length > 0) {
        data.attachment = formattedAttachments.map((a) => a.data);
      }

      const result = await this.mg.messages.create(this.domain, data);
      this.logger.log(`✅ Email enviado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }
}
