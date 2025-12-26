import { Injectable, Logger } from '@nestjs/common';

// ✅ Import correto (evita undefined no Render)
const Brevo = require('@getbrevo/brevo');

@Injectable()
export class MailerService {
  private logger = new Logger(MailerService.name);
  private apiInstance: any;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      throw new Error('BREVO_API_KEY não definida');
    }

    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ) {
    try {
      const email = new Brevo.SendSmtpEmail();

      email.to = [{ email: to }];
      email.sender = {
        name: 'GeoToy',
        email: process.env.BREVO_SENDER || 'geotoysuporte@gmail.com',
      };
      email.subject = subject;
      email.htmlContent = htmlContent;

      await this.apiInstance.sendTransacEmail(email);

      this.logger.log(`✅ Email enviado para ${to}`);
    } catch (error) {
      this.logger.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }
}
