import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  atendimento: number;

  @IsNumber()
  tempoEntrega: number;

  @IsNumber()
  qualidadeMaterial: number;

  @IsString()
  comentario: string;
}
