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


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
     ScheduleModule.forRoot(),
 TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,   // aws-1-sa-east-1.pooler.supabase.com
  port: Number(process.env.DB_PORT), // 6543
  username: process.env.DB_USERNAME, // postgres.kgcafqfuqkowxkbyrcau
  password: process.env.DB_PASSWORD, // IToyXwoXxDUggbSf
  database: process.env.DB_NAME,     // postgres
  autoLoadEntities: true,
  synchronize: false, // ⚠️ cuidado em produção, pode apagar dados
  ssl: {
    rejectUnauthorized: false, // Supabase exige SSL
  },
}),


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
