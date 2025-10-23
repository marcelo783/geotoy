import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailConfigService } from './email-config.service';

@Injectable()
export class MailerService {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; path: string }[],
  ) {
    // 🔹 Busca do banco a config descriptografada
    const config = await this.emailConfigService.getDecryptedConfig();

    if (!config || !config.email || !config.password) {
      throw new Error('❌ Configuração de e-mail não encontrada ou incompleta.');
    }

    // 🔹 Cria o transportador do Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.email,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 🔹 Envia o e-mail
    await transporter.sendMail({
      from: `"Geotoy" <${config.email}>`,
      to,
      subject,
      html,
      attachments,
    });
  }
}
