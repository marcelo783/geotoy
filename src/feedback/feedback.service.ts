import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entity/feedback.entity';
import { Order } from 'src/orders/entities/order.entity';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  // Criar novo feedback
  async create(dto: CreateFeedbackDto) {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const feedback = this.feedbackRepo.create({
      atendimento: dto.atendimento,
      tempoEntrega: dto.tempoEntrega,
      qualidadeMaterial: dto.qualidadeMaterial,
      comentario: dto.comentario,
      order,
    });

    return this.feedbackRepo.save(feedback);
  }

  // Listar todos feedbacks com dados do pedido
  async findAll() {
    return this.feedbackRepo.find({
      relations: ['order'],
      order: { id: 'DESC' }, // ordena do mais recente pro mais antigo
    });
  }

  // Listar feedbacks de um pedido específico
  async findByOrder(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['feedbacks'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado`);
    }

    return order.feedbacks;
  }
}
