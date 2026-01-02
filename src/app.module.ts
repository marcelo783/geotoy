import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { OrdersModule } from './orders/orders.module'
import { MailerModule } from './mailer/mailer.module'
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { ScheduleModule } from '@nestjs/schedule';
import { FeedbackModule } from './feedback/feedback.module'
import { CloudinaryModule } from './cloudinary/cloudinary.module'


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
     ScheduleModule.forRoot(),
 TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,   
  port: Number(process.env.DB_PORT), 
  username: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,     
  autoLoadEntities: true,
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
}),

    CloudinaryModule,
    OrdersModule,
    MailerModule,
    AuthModule,
    UsersModule,
    FeedbackModule,
 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
