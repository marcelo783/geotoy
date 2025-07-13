import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsObject } from 'class-validator';

export class CreateOrderDto {
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
  previsaoEntrega?: Date;

   @IsOptional()
  @IsObject()
  mensagemEmail?: {
    producao?: string
    finalizado?: string
    enviado?: string
  }

  @IsOptional()
  @IsObject()
  mensagemWhatsApp?: {
    producao?: string
    finalizado?: string
    enviado?: string
  }

  @IsOptional()
  @IsString()
  status?: string // ex: "novo", "producao", "finalizado", "enviado"

   @IsOptional()
  @IsString()
  notaFiscalPath?: string 
}

