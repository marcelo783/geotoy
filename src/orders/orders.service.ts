import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { gerarTemplateEmail } from 'src/templates/email-template.service';
import * as FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';
import { PdfUploadService } from './pdf-upload.service';
import { MailerService } from '../mailer/mailer.service';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from 'src/supabase/supabase.service';
import { v4 as uuid } from 'uuid';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';


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
  feedback: 'FEEDBACK',
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

function gerarFotosHTML(imageUrls: string[]) {
  return imageUrls
    .map((url, i) => {
      const cid = `cid-foto-${i + 1}`;
      return `
      <a href="cid:${cid}">
        <img src="cid:${cid}" 
             style="width: 160px; margin: 10px; border-radius: 10px; cursor: zoom-in;">
      </a>`;
    })
    .join('');
}


@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly mensagensPorStatus = {
    producao: {
      assunto: 'A produção do seu Toy art está à todo vapor',
      mensagem: `Seu pedido já entrou na fase de produção! Aqui é onde a mágica acontece: tinta, criatividade e atitude se unem pra dar vida ao seu toy exclusivo 🔥<br><br>Estamos cuidando de cada detalhe. <br> Assim que estiver finalizado, avisamos por aqui! <br><br> Obrigado por fazer parte da cultura Geotoy 💜`,
      gifUrl:
        'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGQ2eDZma3piY3Jpdm85YjJxcnN3d256M2d3bXluMGFtMHhnM2E3ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/65CID1pYSa5vDkKOqw/giphy.gif',
    },
    finalizado: {
      assunto: 'Seu toy ficou pronto! Preparando para envio',
      mensagem: `Seu Toy exclusivo ficou pronto!<br>Finalizamos a criação e ele já está sendo embalado com segurança, pronto para chegar até você.<br><br>Confira a foto do seu novo Toy art no anexo.<br><br>Em breve, enviaremos o código de rastreio.<br> Você está a poucos dias de conhecer sua peça exclusiva 🎁`,
      gifUrl:
        'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTc5aXE5ZnRqbHh6dG9jeGxldjZweDlqbTVtamVuOTNmNTJnazJpdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gFoaKERQN3MliFPfNh/giphy.gif',
    },
    enviado: {
      assunto: 'Seu Toy Art foi enviado! Acompanhe a entrega',
      mensagem: `Seu Toy art foi enviado e já está a caminho da sua coleção!<br><br> 🚚🔥🧾A NF está anexada neste e-mail em PDF. <br> <br> Obrigado por apoiar a arte independente e fazer parte da comunidade Geotoy 💥
Se precisar de algo, estamos por aqui!F`,
      gifUrl:
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWZxMmg0anBrd3c3NWZ3Mjg1b3QzOTk3aW12NDFpc2Q3dnEwM2ttaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GwdFYLWWgDBQ6kNzgF/giphy.gif',
    },
    feedback: {
      // A chave deve ser em minúsculas, por convenção
      assunto: 'O que achou do seu Toy art? Conta pra gente!',
      mensagem:  (orderId: string) => `Faz 48 horas que seu Toy chegou por aí e queremos saber: <br><br> Como foi sua experiência? <br> Seu feedback é muito importante pra gente continuar criando toys únicos, com alma, atitude e arte. <br><br> 👉 Deixe sua opinião aqui: <a href="http://localhost:5173/avaliacao?orderId=${orderId}" target="_blank">
      Clique aqui para avaliar
    </a> <br><br> Agradecemos de coração por fazer parte da cultura Geotoy! <br> Nos vemos na próxima criação, conte conosco para amplicar sua coleção! 🎨🧠`,
      gifUrl:
        'https://i.postimg.cc/MKVdDP6C/Puss-In-Boots-Awww-GIF-by-Universal-Pictures-Home-Entertainment.gif',
    },
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly pdfUploadService: PdfUploadService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly cloudinaryService: CloudinaryService,
   
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    console.log('📥 Criando nova ordem:', createOrderDto);

    const order = this.orderRepository.create(createOrderDto);
    const savedOrder = await this.orderRepository.save(order);
    console.log('💾 Ordem salva:', savedOrder);
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
        mostrarAcompanhamento: true,
        produto: savedOrder.produto,
        descricao: savedOrder.observacao?.join(', ') || 'Sem observações',
        valorUnitario: savedOrder.valorUnitario?.toFixed(2) || '0.00',
        frete: savedOrder.frete?.toFixed(2) || '0.00',
        valorTotal: savedOrder.valorTotal?.toFixed(2) || '0.00',
        gerarEtapas: gerarLinhaDoTempoHTML(status), // ou 'producao', etc.
      });

      try {
        await this.mailerService.sendEmailWithImages(
          savedOrder.email,
          'Recebemos seu pedido na Geotoy!',
          html,
          [],
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

  
   async findAll(startDate?: string, endDate?: string): Promise<Order[]> {
    const where: any = {};
    
    // Adicionar filtro de data se fornecido
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    return this.orderRepository.find({ where });
  }

  //contador pintura:
   async countByPintor(pintor: string, startDate?: string, endDate?: string): Promise<number> {
    const where: any = { pintor };
    
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    return this.orderRepository.count({ where });
  }

  //todos

 async countAllPintores(startDate?: string, endDate?: string) {
  let query = this.orderRepository
    .createQueryBuilder('order')
    .select('COALESCE(order.pintor, \'Não definido\')', 'pintor')
    .addSelect('COUNT(*)', 'total')
    .groupBy('order.pintor');

  if (startDate && endDate) {
    query = query.where('order.createdAt BETWEEN :startDate AND :endDate', {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  } else if (startDate) {
    query = query.where('order.createdAt >= :startDate', {
      startDate: new Date(startDate),
    });
  } else if (endDate) {
    query = query.where('order.createdAt <= :endDate', {
      endDate: new Date(endDate),
    });
  }

  return query.getRawMany();
}


  // métricas para dashboard

 async getMetrics(from: string, to: string) {
    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(new Date(from), new Date(to)),
      },
    });

    const totalPedidos = orders.length;
    const totalValor = orders.reduce((acc, order) => acc + Number(order.valorTotal), 0);
    const totalFrete = orders.reduce((acc, order) => acc + Number(order.frete), 0);

    const statusCount: Record<string, number> = {};
    const freteCount: Record<string, number> = {};
    const produtos: string[] = [];

    for (const order of orders) {
      // Contagem por status
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;

      // Contagem por tipo de frete (agora agrupando por tipo)
      const tipoFrete = order.tipoFrete || 'OUTRO';
      freteCount[tipoFrete] = (freteCount[tipoFrete] || 0) + Number(order.frete || 0);

      // Lista de produtos (nome/descrição)
      if (order.produto && !produtos.includes(order.produto)) {
        produtos.push(order.produto);
      }
    }

    return {
      totalPedidos,
      totalValor,
      totalFrete,
      statusCount,
      freteCount,
      produtos,
    };
  }


  async getOverviewByYear(year: number) {
  const query = this.orderRepository
    .createQueryBuilder('order')
    .select("EXTRACT(MONTH FROM order.createdAt)", "month")
    .addSelect("SUM(order.valorTotal - COALESCE(order.frete, 0))", "total")
    .where("EXTRACT(YEAR FROM order.createdAt) = :year", { year })
    .groupBy("month")
    .orderBy("month", "ASC");

  const raw = await query.getRawMany();

  // Transforma em array com 12 meses
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const result = months.map((name, idx) => {
    const found = raw.find((r) => parseInt(r.month) === idx + 1);
    return {
      name,
      total: found ? parseFloat(found.total) : 0
    };
  });

  return result;
}

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    console.log('Service update() recebeu:', updateOrderDto);

    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    // 🔄 Atualiza valorTotal automaticamente
    const novoFrete =
      typeof updateOrderDto.frete === 'number'
        ? updateOrderDto.frete
        : order.frete || 0;
    const novoValor =
      typeof updateOrderDto.valorUnitario === 'number'
        ? updateOrderDto.valorUnitario
        : order.valorUnitario || 0;
    updateOrderDto.valorTotal = novoFrete + novoValor;

    // ✅ Atualiza os campos no banco
    await this.orderRepository.update(id, updateOrderDto);

    const updatedOrder = await this.orderRepository.findOne({ where: { id } });

    if (!updatedOrder) {
      throw new NotFoundException(`Erro ao atualizar pedido com ID ${id}`);
    }

    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderRepository.delete(id);

    if (result.affected === 0) {
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
        tipoFrete: dados.tipoFrete,
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
  const ordem = await this.orderRepository.findOne({ where: { id } });

  if (!ordem) {
    throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
  }

  // 🔥 Criar HTML das imagens inline
  function gerarFotosHTML(anexos: Express.Multer.File[] = []) {
    return anexos
      .filter(file => file.mimetype.startsWith("image/")) // só imagens
      .map((file, index) => `
        <a href="cid:foto-${index}">
          <img src="cid:foto-${index}"
               style="width: 160px; margin: 10px; border-radius: 10px;">
        </a>
      `)
      .join('');
  }

  const fotosHTML = gerarFotosHTML(anexos);
  const mostrarFotos = fotosHTML.length > 0;

  // 🔥 Attachments com CID
const attachments: {
    filename: string;
    path: string;
    cid: string;
  }[] = anexos?.map((file, index) => ({
    filename: file.originalname,
    path: path.resolve(file.path),
    cid: `cid-foto-${index + 1}`,
  })) || [];

  const config = this.mensagensPorStatus[body.status];
  if (!config) {
    throw new NotFoundException(
      `Mensagem para status "${body.status}" não encontrada`,
    );
  }

  

  const saudacoes = {
    producao: 'Fala',
    finalizado: 'Ei',
    enviado: 'Olá',
    feedback: 'Oi',
  };

  const statusTextos = {
    producao: 'PRODUÇÃO',
    finalizado: 'FINALIZADO',
    enviado: 'ENVIADO',
    feedback: 'FEEDBACK',
  };

  let mensagemFinal: string;

  if (typeof config.mensagem === 'function') {
    mensagemFinal = config.mensagem(ordem.id);
  } else {
    mensagemFinal = config.mensagem;
  }

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

  const shouldShowTracking = body.status === 'enviado';
  const shouldShowSummary = body.status === 'novo';

  const html = gerarTemplateEmail({
    cliente: ordem.cliente,
    saudacao: saudacoes[body.status],
    statusTexto: statusTextos[body.status],
    gerarEtapas: gerarLinhaDoTempoHTML(body.status),
    mensagem: mensagemFinal,
    gifUrl: config.gifUrl,
    codigoRastreamento: body.codigoRastreamento,
    mostrarResumo: shouldShowSummary,
    mostrarAcompanhamento: shouldShowTracking,
    mostrarFotos,
    fotosHTML,
  });

  await this.mailerService.sendEmailWithImages(
    ordem.email,
    config.assunto,
    html,
    attachments,
  );
}



  async getMensagemPorStatus(status: string) {
    const config = this.mensagensPorStatus[status];
    if (!config) {
      throw new NotFoundException(
        `Mensagem para status "${status}" não encontrada`,
      );
    }

    return config;
  }

  async getTodasMensagens() {
    return this.mensagensPorStatus;
  }

async createOrder(dto: CreateOrderDto, files?: Express.Multer.File[]): Promise<Order> {
    const order = this.orderRepository.create(dto);

    if (files && files.length > 0) {
      const fileLinks: string[] = [];

      for (const file of files) {
        const path = `${uuid()}-${file.originalname}`;

        const { error } = await this.supabaseService.cliente
          .storage
          .from(process.env.SUPABASE_BUCKET!)
          .upload(path, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          throw new Error(`Erro ao fazer upload: ${error.message}`);
        }

        const { data } = this.supabaseService.cliente
          .storage
          .from(process.env.SUPABASE_BUCKET!)
          .getPublicUrl(path);

        fileLinks.push(data.publicUrl);
      }

      order.arquivos = fileLinks;
    }

    return await this.orderRepository.save(order);
  }



  // 2) Função genérica que salva PDF ou imagem
  async saveOrderFile(orderId: string, file: Express.Multer.File) {
    const folder = file.mimetype.includes('pdf') ? 'pdfs' : 'images';
    const path = `orders/${orderId}/${folder}/${file.originalname}`;

    // Upload no Supabase Storage
    await this.supabaseService.uploadFile(
      process.env.SUPABASE_BUCKET!,
      path,
      file.buffer,
      file.mimetype,
    );

    // URL pública
    const publicUrl = this.supabaseService.getPublicUrl(
      process.env.SUPABASE_BUCKET!,
      path,
    );

    // Atualizar no banco
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Pedido ${orderId} não encontrado`);

    if (Array.isArray(order.arquivos)) {
      order.arquivos.push(publicUrl);
    } else {
      order.arquivos = [publicUrl];
    }

    await this.orderRepository.save(order);

    return publicUrl;
  }

  // 3) Atalho que chama a genérica (só pra manter compatibilidade)
  async saveOrderPdf(orderId: string, file: Express.Multer.File) {
    return this.saveOrderFile(orderId, file);
  }
 
   @Cron('0 8 * * *') // 👈 produção (1x por dia às 8h da manhã)
   async verificarEntregas() {
     this.logger.log('🔍 Iniciando verificação de entregas nos Correios...');

     const pedidos = await this.orderRepository.find({
       where: { status: 'enviado' },
     });

     this.logger.log(
      `📋 Encontrados ${pedidos.length} pedidos com status "enviado".`,
     );

     let consultas = 0;

     for (const pedido of pedidos) {
       if (!pedido.codigoRastreamento) {
        this.logger.warn(
          `⚠️ Pedido ${pedido.id} não tem código de rastreamento.`,
         );
         continue;
       }

       consultas++;

      try {
         const response = await axios.post(
          'https://api-labs.wonca.com.br/wonca.labs.v1.LabsService/Track',
           { code: pedido.codigoRastreamento },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Apikey ${process.env.SITERASTREIO_API_KEY}`,
            },
           },
         );

        const data = response.data?.json
          ? JSON.parse(response.data.json)
          : null;

        const entregue = data?.eventos?.some(
          (e) =>
             e.codigo === 'BDE' ||
             e.descricao.toLowerCase().includes('entregue'),
        );

        if (entregue) {
         this.logger.log(
           `✅ Pedido ${pedido.id} entregue! Atualizando status e disparando e-mail de feedback...`,
           );

          pedido.status = 'feedback';
          await this.orderRepository.save(pedido);

          await this.enviarEmail(pedido.id, { status: 'feedback' });
        } else {
          this.logger.log(`⏳ Pedido ${pedido.id} ainda em trânsito.`);
        }
       } catch (err) {
        this.logger.error(
          `⚠️ Erro ao consultar pedido ${pedido.id}: ${err.message}`,
         );
      }
    }

    this.logger.log(`📊 Total de consultas feitas na API: ${consultas}`);
   }


}
