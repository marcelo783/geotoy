// src/mailer/mailer.service.ts
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
    // 👇 agora usamos a versão que retorna a senha descriptografada
    const config = await this.emailConfigService.getDecryptedConfig();
    if (!config) throw new Error('Configuração de e-mail não encontrada');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.email,
        pass: config.password, // 👈 senha real descriptografada
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"Geotoy" <${config.email}>`,
      to,
      subject,
      html,
      attachments, // ✅ aceita anexos
    });
  }
}
