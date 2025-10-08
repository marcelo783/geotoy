import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity'; // Novo arquivo que vamos criar já já
import { PdfUploadService } from './pdf-upload.service';
import { MailerModule } from 'src/mailer/mailer.module';
import { Feedback } from 'src/feedback/entity/feedback.entity';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Feedback]),
    SupabaseModule,
    MailerModule,
   
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PdfUploadService],
})
export class OrdersModule {}
