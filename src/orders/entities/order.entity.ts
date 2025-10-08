import { Feedback } from 'src/feedback/entity/feedback.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
   id: string;

@Column('text', { array: true, nullable: true })
arquivos: string[];


  

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

  @Column({ default: false })
  urgente: boolean;

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

   @OneToMany(() => Feedback, (feedback) => feedback.order, { cascade: true })
  feedbacks: Feedback[];

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

  // rastreio
  @Column({ nullable: true })
  codigoRastreamento?: string;

  @Column({ nullable: true })
  trackingCode: string; // código de rastreio (ex: AC906624882BR)

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date; // quando detectamos que foi entregue

  @Column({ default: false })
  feedbackEmailSent: boolean; // para não enviar feedback 2x

  @Column({ type: 'timestamp', nullable: true })
  lastTrackCheckAt: Date; // controle de última verificação

  @Column({ nullable: true })
  carrier: string;
}
