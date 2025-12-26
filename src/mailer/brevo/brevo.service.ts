import { Injectable, Logger } from '@nestjs/common';
import * as Brevo from '@getbrevo/brevo';

@Injectable()
export class BrevoService {
  private logger = new Logger(BrevoService.name);
  private apiInstance: Brevo.TransactionalEmailsApi;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      throw new Error(
        '❌ BREVO_API_KEY não definida no ambiente (.env / Render)',
      );
    }

    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();

      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.sender = {
        name: 'GeoToy',
        email: 'noreply@geotoy.com.br', // ⚠️ deve estar verificado no Brevo
      };
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      this.logger.log(`✅ Email enviado para ${to}`);
    } catch (error) {
      this.logger.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }
}
