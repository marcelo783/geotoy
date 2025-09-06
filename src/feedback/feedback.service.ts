import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
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

  // Listar todos feedbacks com dados do pedido e filtro de data
  async findAll(startDate?: string, endDate?: string): Promise<Feedback[]> {
    // Log para debug
    console.log('Recebendo filtros de data:', { startDate, endDate });

    const where: any = {};

    // Adicionar filtro de data se fornecido
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Ajustar o fim do dia para incluir todo o último dia
      end.setHours(23, 59, 59, 999);

      console.log('Filtrando entre:', start, 'e', end);

      where.createdAt = Between(start, end);
    } else if (startDate) {
      const start = new Date(startDate);
      console.log('Filtrando a partir de:', start);
      where.createdAt = MoreThanOrEqual(start);
    } else if (endDate) {
      const end = new Date(endDate);
      // Ajustar o fim do dia
      end.setHours(23, 59, 59, 999);
      console.log('Filtrando até:', end);
      where.createdAt = LessThanOrEqual(end);
    }

    const result = await this.feedbackRepo.find({
      where,
      relations: ['order'],
      order: { id: 'DESC' },
    });

    console.log('Resultados encontrados:', result.length);
    return result;
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

  // Métricas de feedback com filtro de data
  async getMetrics(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const feedbacks = await this.feedbackRepo.find({ where });

    if (feedbacks.length === 0) {
      return {
        totalAvaliacoes: 0,
        mediaAtendimento: 0,
        mediaTempoEntrega: 0,
        mediaQualidadeMaterial: 0,
        distribuiçãoNotas: {
          atendimento: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          tempoEntrega: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          qualidadeMaterial: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };
    }

    // Calcular médias
    const totalAvaliacoes = feedbacks.length;
    const mediaAtendimento =
      feedbacks.reduce((sum, fb) => sum + fb.atendimento, 0) / totalAvaliacoes;
    const mediaTempoEntrega =
      feedbacks.reduce((sum, fb) => sum + fb.tempoEntrega, 0) / totalAvaliacoes;
    const mediaQualidadeMaterial =
      feedbacks.reduce((sum, fb) => sum + fb.qualidadeMaterial, 0) /
      totalAvaliacoes;

    // Calcular distribuição de notas
    const distribuiçãoNotas = {
      atendimento: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      tempoEntrega: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      qualidadeMaterial: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    feedbacks.forEach((fb) => {
      distribuiçãoNotas.atendimento[
        fb.atendimento as keyof typeof distribuiçãoNotas.atendimento
      ]++;
      distribuiçãoNotas.tempoEntrega[
        fb.tempoEntrega as keyof typeof distribuiçãoNotas.tempoEntrega
      ]++;
      distribuiçãoNotas.qualidadeMaterial[
        fb.qualidadeMaterial as keyof typeof distribuiçãoNotas.qualidadeMaterial
      ]++;
    });

    return {
      totalAvaliacoes,
      mediaAtendimento,
      mediaTempoEntrega,
      mediaQualidadeMaterial,
      distribuiçãoNotas,
    };
  }

  // Buscar feedback por ID
  async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackRepo.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback com ID ${id} não encontrado`);
    }

    return feedback;
  }
}
