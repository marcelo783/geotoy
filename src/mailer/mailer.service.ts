// src/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_FROM,       // ex: seuemail@gmail.com
        pass: process.env.EMAIL_PASSWORD,   // senha ou app password
      },
      tls: {
      rejectUnauthorized: false, // ← ESSENCIAL para contornar o certificado
    },
    })
  }

  async sendEmail(to: string, subject: string, html: string, attachments?: { filename: string; path: string }[],): Promise<void> {
    await this.transporter.sendMail({
      from: `"Geotoy" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      attachments,  
    })
  }
}
