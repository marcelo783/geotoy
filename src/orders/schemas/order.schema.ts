import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  produto: string;

  @Prop({ required: true })
  cliente: string;

  @Prop()
  email: string;

  @Prop()
  telefone: string;

  @Prop()
  endereco: string;

  @Prop({ type: [String] })
  observacao: string[];


  @Prop()
  valorUnitario: number;

  @Prop()
  valorTotal: number;

  @Prop()
  frete: number;

  @Prop() imagem?: string;

   @Prop() imagens?: string[];


  @Prop()
  previsaoEntrega: Date;

  @Prop({ default: 'novo' })
  status?: string

  // 🟨 Adicione isso para evitar o erro de tipo
  @Prop({ type: Object, default: {} })
  mensagemEmail?: {
    producao?: string
    finalizado?: string
    enviado?: string
  }

  @Prop({ type: Object, default: {} })
  mensagemWhatsApp?: {
    producao?: string
    finalizado?: string
    enviado?: string
  }

  @Prop()
notaFiscalPath?: string;


}

export const OrderSchema = SchemaFactory.createForClass(Order);
