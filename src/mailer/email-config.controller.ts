// src/mailer/email-config.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmailConfigService } from './email-config.service';

@Controller('email-config')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  // 🔹 Endpoint para cadastrar ou atualizar a configuração
  @Post()
  async setConfig(
    @Body() body: { email: string; password: string },
  ) {
    await this.emailConfigService.setConfig(body.email, body.password);
    return { message: 'Configuração de e-mail salva com sucesso!' };
  }

  // 🔹 Endpoint para buscar configuração atual (NÃO retorna senha descriptografada por segurança)
  @Get()
  async getConfig() {
    const config = await this.emailConfigService.getConfig();
    if (!config) {
      return { message: 'Nenhuma configuração encontrada.' };
    }

    return {
      email: config.email,
      hasPassword: !!config.password, // só indica que tem senha configurada
    };
  }
}
