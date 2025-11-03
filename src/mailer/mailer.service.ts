import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mailgun from 'mailgun-js';


@Injectable()
export class MailerService {
  private mg: mailgun.Mailgun;
  private domain: string;
  private from: string;
  private logger = new Logger(MailerService.name);

  constructor() {
    this.domain = process.env.MAILGUN_DOMAIN!;
    this.from = process.env.MAILGUN_FROM!;

    this.mg = mailgun({
      apiKey: process.env.MAILGUN_API_KEY!,
      domain: this.domain,
    });
  }

  async sendEmailWithImages(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; path: string; cid?: string }[],
  ) {
    try {
      const data: any = {
        from: this.from,
        to,
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        data.attachment = attachments.map((a) =>
          fs.createReadStream(path.resolve(a.path)),
        );
      }

      const result = await this.mg.messages().send(data);
      this.logger.log(`✅ Email enviado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }
}
