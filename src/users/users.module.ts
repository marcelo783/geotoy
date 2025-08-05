import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../users/users.entity'
import { UsersService } from '../users/users.service'
import { UsersController } from '../users/users.controller'
import { AuthModule } from 'src/auth/auth.module' // mantém isso

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
     forwardRef(() => AuthModule), // isso traz o JwtService já configurado
  ],

  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // bom manter
})
export class UsersModule {}
