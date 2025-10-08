import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateOrderDto {

   arquivos?: string[];
   
  @IsNotEmpty()
  @IsString()
  produto: string;

  @IsNotEmpty()
  @IsString()
  cliente: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  observacao?: string[];

  @IsOptional()
  @IsNumber()
  valorUnitario?: number;

  @IsOptional()
  @IsNumber()
  valorTotal?: number;

  @IsOptional()
  @IsNumber()
  frete?: number;

  @IsOptional()
  @IsString()
  tipoFrete?: string; // "SEDEX" | "PAC" | etc.

  @IsOptional()
  @IsString()
  pintor?: string;

  // ⚠️ Envie como ISO 8601 do front (YYYY-MM-DD ou full ISO). O TypeORM salva como Date.
  @IsOptional()
  @IsDateString()
  previsaoEntrega?: string;

  @IsOptional()
  @IsString()
  imagem?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagens?: string[];

  @IsOptional()
  @IsString()
  status?: string; // "novo" | "producao" | "finalizado" | "enviado"

  @IsOptional()
  @IsBoolean()
  urgente?: boolean;


  @IsOptional()
  @IsObject()
  mensagemEmail?: {
    producao?: string;
    finalizado?: string;
    enviado?: string;
  };

  @IsOptional()
  @IsObject()
  mensagemWhatsApp?: {
    producao?: string;
    finalizado?: string;
    enviado?: string;
  };

  @IsOptional()
  @IsString()
  notaFiscalPath?: string;

  // Rastreamento
  @IsOptional()
  @IsString()
  codigoRastreamento?: string;

  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @IsOptional()
  @IsBoolean()
  feedbackEmailSent?: boolean;

  @IsOptional()
  @IsDateString()
  lastTrackCheckAt?: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @Expose()
  createdAt: Date;
}
