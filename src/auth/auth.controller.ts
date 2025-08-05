// src/auth/auth.controller.ts
import { Controller, Post, Body, Res, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; senha: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const {token, usuario} = await this.authService.login(body.email, body.senha);

    // Define o cookie HTTP-only
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'lax', // ou 'none' com https
      secure: false, // true apenas se estiver usando https
    });

    return { message: 'Login realizado com sucesso', usuario };
  }

  @Post('register')
  async register(@Body() body: { nome: string; email: string; senha: string }) {
    return this.authService.register(body.nome, body.email, body.senha);
  }

   @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: Request) {
    const user = (req as any).user; // depende do payload
    return {
      id: user.sub,
      email: user.email,
      nome: user.nome, // se você incluir isto no token payload
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { message: 'Logout efetuado com sucesso' };
  }
}
