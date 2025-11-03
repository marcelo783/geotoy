import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import Mailgun from 'mailgun.js';
import formData from 'form-data'; // 👈 Import correto

@Injectable()
export class MailerService {
  private mg: any;
  private domain: string;
  private from: string;
  private logger = new Logger(MailerService.name);

  constructor() {
    // 👇 Aqui está o segredo: garantir o uso de "form-data" para Node
    const mailgun = new Mailgun(formData);

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
      // Converte os anexos em streams
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
