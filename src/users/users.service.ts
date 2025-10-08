import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/users.entity'
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

async findByEmail(email: string): Promise<User | null> {
  console.log('🔍 Procurando email:', email);
  const user = await this.userRepository.findOne({ where: { email } });
  console.log('🔍 Encontrado:', user);
  return user;
}



  async create(userData: Partial<User>) {
    const user = this.userRepository.create(userData)
    return this.userRepository.save(user)
  }

async updateUser(
  id: string,
  data: { nome?: string; email?: string; senha?: string }
) {
  const updateData: Partial<User> = {};

  if (data.nome) updateData.nome = data.nome;
  if (data.email) updateData.email = data.email;
  if (data.senha) updateData.senha = await bcrypt.hash(data.senha, 10);

  await this.userRepository.update(id, updateData);

  // ✅ Retorna o usuário atualizado
  return this.userRepository.findOneBy({ id });
}

}
