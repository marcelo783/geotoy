import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MongooseModule } from '@nestjs/mongoose'
import { OrdersModule } from './orders/orders.module'
import { MailerModule } from './mailer/mailer.module'

@Module({
  imports: [
    // ✅ Carrega o .env
    ConfigModule.forRoot({
      isGlobal: true, // torna disponível em toda a aplicação
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/geotoy'),
    OrdersModule,
    MailerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
