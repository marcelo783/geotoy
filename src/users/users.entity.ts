import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

 @Column({ nullable: false })
 nome: string;


  @Column({ unique: true })
  email: string

  @Column()
  senha: string
}
