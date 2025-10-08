import { Controller, Post, Body, BadRequestException, UseGuards, Patch, Req, Res} from '@nestjs/common'
import { UsersService } from './users.service'
import * as bcrypt from 'bcrypt'
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';


@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  @Post('register')
  async register(@Body() body: { nome: string; email: string; password: string }) {
    const existing = await this.usersService.findByEmail(body.email)
    if (existing) {
      throw new BadRequestException('E-mail já está em uso.')
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const user = await this.usersService.create({
      nome: body.nome,
      email: body.email,
      senha: hashedPassword,
    })

    return {
      message: 'Usuário registrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
      },
    }
  }

 @UseGuards(AuthGuard('jwt'))
  @Patch('update')
  async updateProfile(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { nome?: string; email?: string; senha?: string },
  ) {
    const userId = (req as any).user.sub;

    const updatedUser = await this.usersService.updateUser(userId, body);

    if (!updatedUser) {
      throw new BadRequestException(
        'Usuário não encontrado ou não foi possível atualizar.',
      );
    }

    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      nome: updatedUser.nome,
    };

    const token = await this.jwtService.signAsync(payload);

    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true, //process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 dia
    });

    return {
      message: 'Usuário atualizado com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nome: updatedUser.nome,
      },
    };
  }

}
