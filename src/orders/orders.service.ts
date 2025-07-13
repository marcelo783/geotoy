import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';

import * as FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';
import { PdfUploadService } from './pdf-upload.service';
import { MailerService } from '../mailer/mailer.service';


function parseNumber(value: any): number {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'))
  }
  if (typeof value === 'number') {
    return value
  }
  return 0
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private readonly  pdfUploadService: PdfUploadService, 
      private readonly mailerService: MailerService, 
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const createdOrder = new this.orderModel(createOrderDto);
    return createdOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
  const { frete, valorUnitario, status } = updateOrderDto

  const order = await this.orderModel.findById(id).exec()
  if (!order) {
    throw new NotFoundException(`Pedido com ID ${id} não encontrado`)
  }

  // 🔄 Atualiza valorTotal automaticamente
  const novoFrete = typeof frete === 'number' ? frete : order.frete || 0
  const novoValor = typeof valorUnitario === 'number' ? valorUnitario : order.valorUnitario || 0
  updateOrderDto.valorTotal = novoFrete + novoValor

  // 📬 Verifica se houve mudança de status
  if (status && status !== order.status && order.email) {
    let assunto = ''
    let mensagem = ''

    if (status === 'producao') {
      assunto = 'Seu pedido está em produção'
      mensagem =
        order.mensagemEmail?.producao ||
        'Seu pedido está agora em produção! Em breve estará pronto para envio.'
    } else if (status === 'finalizado') {
      assunto = 'Seu pedido foi finalizado'
      mensagem =
        order.mensagemEmail?.finalizado ||
        'Seu pedido foi finalizado com sucesso! Obrigado pela preferência.'
    } else if (status === 'enviado') {
      assunto = 'Seu pedido foi enviado'
      mensagem =
        order.mensagemEmail?.enviado ||
        'Seu pedido foi enviado. Em breve você receberá no endereço informado.'
    }

   if (mensagem) {
  try {
    const attachments =
      order.status === 'enviado' && order.notaFiscalPath
        ? [
            {
              filename: 'nota-fiscal.pdf',
              path: order.notaFiscalPath,
            },
          ]
        : undefined;

    await this.mailerService.sendEmail(
      order.email,
      assunto,
      `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #0f172a;">Olá ${order.cliente},</h2>
        <p>${mensagem}</p>
        <p><strong>Produto:</strong> ${order.produto}</p>
        <p><strong>Previsão de entrega:</strong> ${order.previsaoEntrega || '-'}</p>
        <br/>
        <p>Atenciosamente,<br/>Equipe Geotoy</p>
      </div>
      `,
      attachments // ✅ último argumento opcional
    );

    console.log(`📧 E-mail automático enviado para ${order.email}`);
  } catch (err) {
    console.warn(`⚠️ Falha ao enviar e-mail para ${order.email}`, err.message);
  }
}

}


  // ✅ Atualiza no banco
  const updatedOrder = await this.orderModel
    .findByIdAndUpdate(id, updateOrderDto, { new: true })
    .exec()

  if (!updatedOrder) {
    throw new NotFoundException(`Pedido com ID ${id} não encontrado`)
  }

  return updatedOrder
}


  async remove(id: string): Promise<void> {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();
    if (!deletedOrder) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }
  }

async processPdf(filePath: string): Promise<Order> {
  try {
    const dados = await this.pdfUploadService.extractDataFromPdf(filePath);

    console.log('📦 Dados recebidos do microserviço Python:', dados);

    const order = new this.orderModel({
      cliente: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      produto: dados.descricao,
      endereco: dados.endereco,
      observacao: dados.observacao,
      valorUnitario: parseNumber(dados.valorUnitario), // usa versão de cima
      valorTotal: parseNumber(dados.valorTotal),
      frete: parseNumber(dados.frete),
      previsaoEntrega: dados.previsaoEntrega
        ? new Date(dados.previsaoEntrega.split('/').reverse().join('-'))
        : undefined,
      imagem: dados.imagem,
      status: 'novo',
    });

    await order.save();

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return order;
  } catch (err) {
    console.error('❌ Erro ao processar PDF:', err);
    throw new HttpException('Falha ao extrair dados do PDF', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}




  // private extract(
  //   text: string,
  //   patte
  // rn: RegExp,
  //   group: number = 0,
  // ): string | undefined {
  //   const match = text.match(pattern);
  //   return match ? match[group] : undefined;
  // }

  // private extractValorReal(text: string): string | undefined {
  //   const regex = /(MUNNY.*?)(\d{1,3}(?:\.\d{3})*,\d{2})/g;
  //   const matches: string[] = [];

  //   for (const match of text.matchAll(regex)) {
  //     matches.push(match[2]);
  //   }

  //   if (matches.length) {
  //     return matches.sort((a, b) =>
  //       parseFloat(b.replace(/\./g, '').replace(',', '.')) -
  //       parseFloat(a.replace(/\./g, '').replace(',', '.'))
  //     )[0];
  //   }

  //   const fallback = [...text.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})/g)].map((m) => m[1]);
  //   if (fallback.length) {
  //     return fallback.sort((a, b) =>
  //       parseFloat(b.replace(/\./g, '').replace(',', '.')) -
  //       parseFloat(a.replace(/\./g, '').replace(',', '.'))
  //     )[0];
  //   }

  //   return undefined;
  // }

}
