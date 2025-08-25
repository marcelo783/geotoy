import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Controller('avaliacao') // 👈 rota base
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  findAll() {
    return this.feedbackService.findAll();
  }

  @Get(':orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.feedbackService.findByOrder(orderId);
  }

  @Post()
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }
}
