import { Order } from 'src/orders/entities/order.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';


@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.feedbacks, { onDelete: 'CASCADE' })
  order: Order;


  @Column('int')
  atendimento: number;

  @Column('int')
  tempoEntrega: number;

  @Column('int')
  qualidadeMaterial: number;

  @Column('text')
  comentario: string;

  @CreateDateColumn()
  createdAt: Date;
}
