// src/dashboard/dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { FeedbackService } from 'src/feedback/feedback.service';


@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @Get('metrics')
  async getDashboardMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Buscar métricas de pedidos
    const ordersMetrics = await this.ordersService.getMetrics(
      startDate || new Date(0).toISOString(),
      endDate || new Date().toISOString(),
    );

    // Buscar métricas de feedback (se aplicável)
    const feedbackMetrics = await this.feedbackService.getMetrics(
      startDate,
      endDate,
    );

    return {
      orders: ordersMetrics,
      feedback: feedbackMetrics,
    };
  }
}