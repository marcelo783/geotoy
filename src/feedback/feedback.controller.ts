import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';

// feedback.controller.ts
@Controller('avaliacao')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.feedbackService.findAll(startDate, endDate);
  }

  @Get('metrics')
  getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.feedbackService.getMetrics(startDate, endDate);
  }

  // CORREÇÃO: Mudar a rota para evitar conflito
  @Get('order/:orderId') // Agora é /avaliacao/order/:orderId
  findByOrder(@Param('orderId') orderId: string) {
    return this.feedbackService.findByOrder(orderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Post()
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }
}