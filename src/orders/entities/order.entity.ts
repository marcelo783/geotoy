import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  produto: string;

  @Column()
  cliente: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  endereco: string;

  @Column('text', { array: true, nullable: true })
  observacao: string[];

  @Column('float', { nullable: true })
  valorUnitario: number;

  @Column('float', { nullable: true })
  valorTotal: number;

  @Column('float', { nullable: true })
  frete: number;

  // antes: @Column('float', { nullable: true }) tipoFrete: number;
  @Column({ type: 'varchar', length: 20, nullable: true })
  tipoFrete?: string; // "SEDEX" | "PAC" | undefined

  @Column({ nullable: true })
  pintor?: string;

  @Column({ nullable: true })
  imagem: string;

  @Column('text', { array: true, nullable: true })
  imagens: string[];

  @Column({ type: 'timestamp', nullable: true })
  previsaoEntrega: Date;

  @Column({ default: 'novo' })
  status: string;

  @Column('jsonb', { nullable: true })
  mensagemEmail: {
    producao?: string;
    finalizado?: string;
    enviado?: string;
  };

  @Column('jsonb', { nullable: true })
  mensagemWhatsApp: {
    producao?: string;
    finalizado?: string;
    enviado?: string;
  };

  @Column({ nullable: true })
  notaFiscalPath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
