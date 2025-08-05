import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) throw new UnauthorizedException('Senha inválida');

    return user;
  }

  async login(email: string, senha: string) {
    const user = await this.validateUser(email, senha);

    const payload = { sub: user.id, email: user.email, nome: user.nome, };

    const token = await this.jwtService.signAsync(payload);
    console.log('Token gerado:', token); // 🔍 Log do token

    // ✅ Retorna apenas o token como string
    return {
     token,
    usuario: {
      nome: user.nome, 
      email: user.email,
    },
  };
}
  

  async register(nome: string, email: string, senha: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Usuário já existe');
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const user = await this.usersService.create({
      nome,
      email,
      senha: senhaHash,
    });

    return { message: 'Usuário criado com sucesso', user };
  }
}
