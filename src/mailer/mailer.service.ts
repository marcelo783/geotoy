// src/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

async sendEmailWithImages(
  to: string,
  subject: string,
  html: string,
  attachments: {
    filename: string;
    path: string;
    cid: string;
  }[],
) {
  try {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments,
    });

    return { success: true };
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    throw err;
  }
}

}
