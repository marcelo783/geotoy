// src/mailer/mailer.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Mailgun from 'mailgun.js';
import * as formData from 'form-data';

@Injectable()
export class MailerService {
  private mg: any;
  private domain: string;
  private from: string;

  constructor() {
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
    attachments?: {
      filename: string;
      path: string;
      cid: string;
    }[],
  ) {
    try {
      const data: any = {
        from: this.from,
        to,
        subject,
        html,
      };

      if (attachments?.length) {
        data.attachment = attachments.map((att) => ({
          filename: att.filename,
          path: att.path,
          cid: att.cid,
        }));
      }

      const result = await this.mg.messages.create(this.domain, data);
      console.log('✅ Email enviado com sucesso:', result.id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new InternalServerErrorException('Falha ao enviar o email');
    }
  }
}
