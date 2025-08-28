// src/mailer/email-config.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { EmailConfig } from './entity/email-config.entity';

@Injectable()
export class EmailConfigService {
  constructor(
    @InjectRepository(EmailConfig)
    private readonly repo: Repository<EmailConfig>,
  ) {}

  private readonly algorithm = 'aes-256-ctr';
  private readonly secretKey = process.env.EMAIL_SECRET_KEY || 'fallback_secret_key';

  // ✅ Garante que a chave sempre terá 32 bytes
  private getKey(): Buffer {
    return crypto.createHash('sha256').update(this.secretKey).digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(hash: string): string {
    const [ivHex, encryptedHex] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString();
  }

  async setConfig(email: string, password: string) {
  let config = await this.repo.findOneBy({});
  if (!config) {
    config = this.repo.create({
      email,
      password: this.encrypt(password),
    });
  } else {
    config.email = email;
    config.password = this.encrypt(password);
  }
  return this.repo.save(config);
}

async getConfig() {
  const config = await this.repo.findOneBy({});
  if (!config) return null;
  return {
    email: config.email,
    password: this.decrypt(config.password),
  };
}

}
