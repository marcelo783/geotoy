import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { gerarTemplateEmail } from 'src/templates/email-template.service';
import * as FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';
import { PdfUploadService } from './pdf-upload.service';
import { MailerService } from '../mailer/mailer.service';
import * as path from 'path';

function parseNumber(value: any): number {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }
  if (typeof value === 'number') {
    return value;
  }
  return 0;
}

const statusTextos = {
  novo: 'PEDIDO RECEBIDO',
  producao: 'PRODUÇÃO',
  finalizado: 'FINALIZADO',
  enviado: 'ENVIADO',
};

const saudacoes = {
  novo: 'Olá',
  producao: 'Fala',
  finalizado: 'Ei',
  enviado: 'Olá',
};

function gerarLinhaDoTempoHTML(
  status: 'novo' | 'producao' | 'finalizado' | 'enviado',
): string {
  const steps = ['Recebido', 'Produção', 'Finalizado', 'Enviado'];
  const currentIndex = {
    novo: 0,
    producao: 1,
    finalizado: 2,
    enviado: 3,
  }[status];

  return steps
    .map((step, index) => {
      const isAtiva = index === currentIndex;
      const isConcluida = index < currentIndex;

      const corFundo = isAtiva
        ? '#ec4899'
        : isConcluida
          ? '#10b981'
          : '#cbd5e1';

      const statusTexto = isAtiva
        ? 'Status atual'
        : isConcluida
          ? '<span style="color:#10b981;font-weight:bold;">✓</span>'
          : 'Em breve';

      const corBorda = isAtiva ? '#ec4899' : '#e2e8f0';

      return `
      <td valign="top" style="padding: 0 7.5px 15px 7.5px; width: 25%;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid ${corBorda}; position: relative; overflow: hidden;">
          <tr>
            <td style="padding: 0">
              <div style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: ${corFundo}; color: white; font-weight: bold; font-size: 18px; line-height: 40px; text-align: center; margin-bottom: 15px;">
                ${index + 1}
              </div>
            </td>
            <td style="padding: 0; text-align: center">
              <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 5px;">
                ${step}
              </div>
              <div style="font-size: 14px; color: #64748b; font-style: italic;">
                ${statusTexto}
              </div>
            </td>
          </tr>
        </table>
      </td>`;
    })
    .join('');
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private readonly pdfUploadService: PdfUploadService,
    private readonly mailerService: MailerService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    console.log('📥 Criando nova ordem:', createOrderDto);

    const createdOrder = new this.orderModel(createOrderDto);
    const savedOrder = await createdOrder.save();

    const status = 'novo';

    if (savedOrder.email) {
      const html = gerarTemplateEmail({
        cliente: savedOrder.cliente,
        saudacao: saudacoes[status],
        statusTexto: statusTextos[status],

        mensagem: `🎉 Boa notícia chegando! 🎉<br>Recebemos seu pedido e ele já está entrando na nossa linha de produção!
        Aqui na Geotoy, cada toy art é feito à mão, com alma, tinta e aquele toque insano de criatividade que a gente AMA.
        Pode se preparar... vem arte braba por aí! 🔥🖌️`,
        gifUrl:
          'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGlxMnlrZWUzdnFkZms2NWs2dXJxdHdpZHE4Nmx4YjE3ZHFxNnB1MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/11sBLVxNs7v6WA/giphy.gif',
        mostrarResumo: true,
        produto: savedOrder.produto,
        descricao: savedOrder.observacao?.join(', ') || 'Sem observações',
        valorUnitario: savedOrder.valorUnitario?.toFixed(2) || '0.00',
        frete: savedOrder.frete?.toFixed(2) || '0.00',
        valorTotal: savedOrder.valorTotal?.toFixed(2) || '0.00',
        gerarEtapas: gerarLinhaDoTempoHTML(status), // ou 'producao', etc.
      });

      try {
        await this.mailerService.sendEmail(
          savedOrder.email,
          'Recebemos seu pedido na Geotoy!',
          html,
        );
        console.log(
          `📧 E-mail de confirmação enviado para ${savedOrder.email}`,
        );
      } catch (err) {
        console.warn(`⚠️ Falha ao enviar e-mail: ${err.message}`);
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
    const { frete, valorUnitario, status } = updateOrderDto;

    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    // 🔄 Atualiza valorTotal automaticamente
    const novoFrete = typeof frete === 'number' ? frete : order.frete || 0;
    const novoValor =
      typeof valorUnitario === 'number'
        ? valorUnitario
        : order.valorUnitario || 0;
    updateOrderDto.valorTotal = novoFrete + novoValor;

    // ✅ Atualiza no banco
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    return updatedOrder;
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
      throw new HttpException(
        'Falha ao extrair dados do PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async enviarEmail(id: string, body: any, anexos?: Express.Multer.File[]) {
    const ordem = await this.orderModel.findById(id);
    if (!ordem) throw new NotFoundException('Ordem não encontrada');

    const attachments =
      anexos?.map((file) => ({
        filename: file.originalname,
        path: path.resolve(file.path),
      })) || [];

    const mensagensPorStatus = {
      producao: {
        assunto: 'A produção do seu Toy art está à todo vapor',
        mensagem: `Seu pedido já entrou na fase de produção! Aqui é onde a mágica acontece: tinta, criatividade e atitude se unem pra dar vida ao seu toy exclusivo 🔥<br><br>Estamos cuidando de cada detalhe. <br> Assim que estiver finalizado, avisamos por aqui! <br><br> Obrigado por fazer parte da cultura Geotoy 💜`,
        gifUrl: 'https://i.postimg.cc/668TCc4r/bob-GIF.gif',
      },
      finalizado: {
        assunto: 'Seu toy ficou pronto! Preparando para envio',
        mensagem: `Seu Toy exclusivo ficou pronto!<br>Finalizamos a criação e ele já está sendo embalado com segurança, pronto para chegar até você.<br><br>Confira a foto do seu novo Toy art no anexo.<br><br>Em breve, enviaremos o código de rastreio.<br> Você está a poucos dias de conhecer sua peça exclusiva 🎁`,
        gifUrl: 'https://i.postimg.cc/QNvCm7cR/Happy-Minions-GIF.gif',
      },
      enviado: {
        assunto: 'Seu Toy Art foi enviado! Acompanhe a entrega',
        mensagem: `Seu Toy art foi enviado e já está a caminho da sua coleção!<br><br> 🚚🔥🧾A NF está anexada neste e-mail em PDF. <br> <br> Obrigado por apoiar a arte independente e fazer parte da comunidade Geotoy 💥
Se precisar de algo, estamos por aqui!F`,
        gifUrl: 'https://i.postimg.cc/nryympjP/carlton-banks-dancing-GIF.gif',
      },
    };

    const saudacoes = {
      producao: 'Fala',
      finalizado: 'Ei',
      enviado: 'Olá',
    };

    const statusTextos = {
      producao: 'PRODUÇÃO',
      finalizado: 'FINALIZADO',
      enviado: 'ENVIADO',
    };

    function gerarLinhaDoTempoHTML(
      status: 'producao' | 'finalizado' | 'enviado',
    ): string {
      const steps = ['Recebido', 'Produção', 'Finalizado', 'Enviado'];
      const currentIndex = {
        producao: 1,
        finalizado: 2,
        enviado: 3,
      }[status];

      return steps
        .map((step, index) => {
          const isAtiva = index === currentIndex;
          const isConcluida = index < currentIndex;

          const corFundo = isAtiva
            ? '#ec4899'
            : isConcluida
              ? '#10b981'
              : '#cbd5e1';

          const statusTexto = isAtiva
            ? 'Status atual'
            : isConcluida
              ? '<span style="color:#10b981;font-weight:bold;">✓</span>'
              : 'Em breve';

          const corBorda = isAtiva ? '#ec4899' : '#e2e8f0';

          return `
        <td valign="top" style="padding: 0 7.5px 15px 7.5px; width: 25%;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid ${corBorda}; position: relative; overflow: hidden;">
            <tr>
              <td style="padding: 0">
                <div style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: ${corFundo}; color: white; font-weight: bold; font-size: 18px; line-height: 40px; text-align: center; margin-bottom: 15px;">
                  ${index + 1}
                </div>
              </td>
              <td style="padding: 0; text-align: center">
                <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 5px;">
                  ${step}
                </div>
                <div style="font-size: 14px; color: #64748b; font-style: italic;">
                  ${statusTexto}
                </div>
              </td>
            </tr>
          </table>
        </td>`;
        })
        .join('');
    }

    const config = mensagensPorStatus[body.status];

    const html = gerarTemplateEmail({
      cliente: ordem.cliente,
      saudacao: saudacoes[body.status],
      statusTexto: statusTextos[body.status],
      gerarEtapas: gerarLinhaDoTempoHTML(body.status),
      mensagem: config.mensagem,
      gifUrl: config.gifUrl,
      codigoRastreamento: body.codigoRastreamento,
      mostrarResumo: false,
    });

    await this.mailerService.sendEmail(
      ordem.email,
      config.assunto,
      html,
      attachments,
    );
  }
}
