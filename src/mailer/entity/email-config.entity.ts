// src/mailer/entity/email-config.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('email_config')
export class EmailConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string; // app password do Gmail
}
