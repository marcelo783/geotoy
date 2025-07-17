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
import * as path from 'path';




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
  console.log('📥 Criando nova ordem:', createOrderDto);

  const createdOrder = new this.orderModel(createOrderDto);
  const savedOrder = await createdOrder.save();

  // Envia e-mail automático de confirmação
  if (savedOrder.email) {
   const html = `
  <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
    <!-- Logo da empresa -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://geotoy.com.br/logo geotoy" alt="Logo Geotoy" style="max-width: 180px;" />
    </div>

    <!-- Saudação -->
    <h2 style="color: #0f172a;">Olá ${savedOrder.cliente},</h2>
    <p>Acabamos de receber o seu pedido e em breve iniciaremos o processo de <strong>customização</strong> com muito carinho e atenção aos detalhes.</p>

    <!-- Imagem do produto -->
    <div style="text-align: center; margin: 20px 0;">
      <img src="${savedOrder.imagem}" alt="Imagem do produto" style="max-width: 100%; border-radius: 8px; border: 1px solid #ccc;" />
    </div>
    
    <!-- Detalhes do pedido -->
    <div style="margin: 20px 0;">
      <h3 style="color: #1e293b;">Detalhes do Pedido:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Produto:</strong> ${savedOrder.produto}</li>
        <li><strong>Observações:</strong> ${savedOrder.observacao || "Nenhuma observação adicionada"}</li>
        <li><strong>Valor Unitário:</strong> R$ ${Number(savedOrder.valorUnitario).toFixed(2)}</li>
        <li><strong>Frete:</strong> R$ ${Number(savedOrder.frete).toFixed(2)}</li>
        <li><strong>Valor Total:</strong> <strong style="color: #16a34a;">R$ ${Number(savedOrder.valorTotal).toFixed(2)}</strong></li>
      </ul>
    </div>

    <!-- Agradecimento -->
    <p>Se tiver qualquer dúvida ou quiser acompanhar o andamento, fique à vontade para nos chamar!</p>
    
    <!-- Assinatura -->
    <p>Atenciosamente,</p>
    <p><strong>Equipe Geotoy</strong></p>
  </div>
`;


    try {
      await this.mailerService.sendEmail(
        savedOrder.email,
        'Recebemos seu pedido',
        html,
      );
      console.log(`📧 E-mail de confirmação enviado para ${savedOrder.email}`);
    } catch (err) {
      console.warn(`⚠️ Falha ao enviar e-mail de boas-vindas: ${err.message}`);
    }
  }

  return savedOrder;
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

async processPdf(filePath: string): Promise<any> {
  try {
    const dados = await this.pdfUploadService.extractDataFromPdf(filePath);

    console.log('📦 Dados recebidos do microserviço Python:', dados);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Apenas retorna os dados extraídos
    return {
      cliente: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      produto: dados.descricao,
      endereco: dados.endereco,
      observacao: dados.observacao,
      valorUnitario: parseNumber(dados.valorUnitario),
      frete: parseNumber(dados.frete),
      valorTotal: parseNumber(dados.valorTotal),
      previsaoEntrega: dados.previsaoEntrega
        ? new Date(dados.previsaoEntrega.split('/').reverse().join('-'))
        : undefined,
      imagem: dados.imagem,
    };
  } catch (err) {
    console.error('❌ Erro ao processar PDF:', err);
    throw new HttpException('Falha ao extrair dados do PDF', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


async enviarEmail(id: string, body: any, anexos?: Express.Multer.File[]) {
  const ordem = await this.orderModel.findById(id);
  if (!ordem) throw new NotFoundException("Ordem não encontrada");

  const attachments = anexos?.map((file) => ({
    filename: file.originalname,
    path: path.resolve(file.path), // ✅ caminho absoluto
  })) || [];

  const html = `
    <div>
      <h2>Olá ${ordem.cliente},</h2>
      <p>${body.mensagem}</p>
      ${body.codigoRastreamento ? `<p><strong>Código:</strong> ${body.codigoRastreamento}</p>` : ''}
      <p><strong>Produto:</strong> ${ordem.produto}</p>
      <p>Equipe Geotoy</p>
    </div>
  `;

  await this.mailerService.sendEmail(
    ordem.email,
    `Atualização do Pedido: ${ordem.produto}`,
    html,
    attachments
  );
}

}


  