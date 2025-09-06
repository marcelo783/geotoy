import { Body, Controller, Get, Post, Patch } from '@nestjs/common';
import { EmailConfigService } from './email-config.service';

@Controller('email-config')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  // 🔹 Criar ou atualizar configuração
  @Post()
  async setConfig(@Body() body: { email: string; password: string }) {
    await this.emailConfigService.setConfig(body.email, body.password);
    return { message: 'Configuração de e-mail salva com sucesso!' };
  }

  // 🔹 Atualizar apenas (se quiser PATCH separado)
  @Patch()
  async updateConfig(@Body() body: { email: string; password: string }) {
    await this.emailConfigService.setConfig(body.email, body.password);
    return { message: 'Configuração de e-mail atualizada com sucesso!' };
  }

  // 🔹 Buscar configuração (sem senha)
  @Get()
  async getConfig() {
    const config = await this.emailConfigService.getConfig();
    if (!config) {
      return { message: 'Nenhuma configuração encontrada.' };
    }
    return config; // já vem com email + hasPassword
  }
}
