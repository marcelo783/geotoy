import { Injectable, Logger } from '@nestjs/common';
import Brevo, {
  TransactionalEmailsApi,
  SendSmtpEmail,
} from '@getbrevo/brevo';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailerService {
  private logger = new Logger(MailerService.name);
  private brevoAPI: TransactionalEmailsApi;

  constructor() {
    this.brevoAPI = new Brevo.TransactionalEmailsApi();
    this.brevoAPI.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!,
    );
  }

  async sendEmailWithImages(
    to: string,
    subject: string,
    html: string,
    attachments?: {
      filename: string;
      path: string;
      cid?: string;
    }[],
  ) {
    try {
      // ✅ Tipagem correta — resolve never[]
      const brevoAttachments: SendSmtpEmail['attachment'] =
        attachments?.map((file) => ({
          name: file.filename,
          content: fs
            .readFileSync(path.resolve(file.path))
            .toString('base64'),
          contentId: file.cid, // ✅ CID inline
        }));

      const sendSmtpEmail: SendSmtpEmail = {
        sender: {
          email: process.env.BREVO_SENDER!,
          name: 'GeoToy',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        attachment: brevoAttachments?.length ? brevoAttachments : undefined,
      };

      // 🔥 O SDK não tipa a resposta corretamente
      const response: any =
        await this.brevoAPI.sendTransacEmail(sendSmtpEmail);

      this.logger.log(
        `✅ Email enviado com sucesso (Brevo) | Message ID: ${
          response?.messageId || response?.body?.messageId || 'N/A'
        }`,
      );

      return response;
    } catch (error) {
      this.logger.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }
}
