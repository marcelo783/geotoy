import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  InternalServerErrorException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import axios from 'axios';
import * as FormData from 'form-data';
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('isPublic', true);


@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('mensagens/:status')
  async getMensagem(@Param('status') status: string) {
    return this.ordersService.getMensagemPorStatus(status);
  }

   @Get('count-all-pintores')
  async countAllPintores(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.countAllPintores(startDate, endDate);
  }

    @Get('count-by-pintor')
  async countByPintor(
    @Query('pintor') pintor: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.countByPintor(pintor, startDate, endDate);
  }

    @Get('testar-cron')
  async testarCron() {
    await this.ordersService.verificarEntregas();
    return { message: '🕒 Verificação de entregas executada manualmente!' };
  }

 @Get('overview')
  async getOverview(@Query('year') year: number) {
    return this.ordersService.getOverviewByYear(year);
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

@Post('pdf')
@UseInterceptors(FileInterceptor('file'))
async extractFromPdf(@UploadedFile() file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('Nenhum arquivo foi enviado');
  }

  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  try {
    const response = await axios.post(
      'https://geotoypython.onrender.com/extract',
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity, // previne erro com arquivos grandes
        timeout: 120000, // 60 segundos de timeout
      },
    );
  
    return response.data;
  }catch (error) {
      console.error('Erro ao chamar o serviço Python:', error.message);
      throw new InternalServerErrorException('Falha ao processar o PDF');
    }
  }
  



  //para rastreio

  @Patch(':id/enviar')
  async marcarComoEnviado(
    @Param('id') id: string,
    @Body() body: { codigoRastreamento: string },
  ) {
    return this.ordersService.update(id, {
      status: 'enviado',
      codigoRastreamento: body.codigoRastreamento,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
     @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
   return this.ordersService.findAll(startDate, endDate);
  }

  @UseGuards(JwtAuthGuard)
  @Get('metrics')
  getMetrics(@Query('from') from: string, @Query('to') to: string) {
    return this.ordersService.getMetrics(from, to);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const fileExt = path.extname(file.originalname);
          const baseName = path
            .basename(file.originalname, fileExt)
            .replace(/\s+/g, '_')
            .replace(/[^\w.-]/gi, '');
          const fileName = `${baseName}_${Date.now()}${fileExt}`;
          cb(null, fileName);
        },
      }),
    }),
  )
  async uploadOrder(@UploadedFile() file: Express.Multer.File) {
    if (!file?.path) {
      throw new BadRequestException('Arquivo não enviado ou mal formatado');
    }

    console.log('Arquivo recebido:', file.originalname);

    const dados = await this.ordersService.processPdf(file.path);

    //console.log('📥 Criando nova ordem com dados extraídos:', dados);

    //const createdOrder = await this.ordersService.create(dados);

    return dados;
  }

  // Rota para upload de PDF de um pedido
  @Post(':id/upload-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrderPdf(
    @Param('id') orderId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo enviado');
    }

    const url = await this.ordersService.saveOrderPdf(orderId, file);
    return { url }; // 🔥 retorna a URL pública
  }

  @Post(':id/enviar-email')
  @UseInterceptors(
    FilesInterceptor('arquivos', 10, {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const fileName = `${Date.now()}-${file.originalname}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não suportado'), false);
        }
      },
    }),
  )
  async enviarEmailComAnexos(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() arquivos: Express.Multer.File[],
  ) {
    console.log('📨 Requisição recebida para ID:', id);
    console.log('📧 Body:', body);
    console.log('📎 Arquivos:', arquivos);

    return this.ordersService.enviarEmail(id, body, arquivos);
  }

@Get('teste-email')
@Public() // ⬅️ cria um decorator para ignorar o guard
async testarEmail() {
  return this.ordersService.testarEmail();
}



  //enviar img

  @Post('com-imagem')
  @UseInterceptors(
    FilesInterceptor('imagens', 5, {
      storage: diskStorage({
        destination: './uploads/imagens',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const nome = `${Date.now()}-${file.originalname}`;
          cb(null, nome);
        },
      }),
    }),
  )
  async criarComImagem(
    @Body() body: any,
    @UploadedFiles() imagens: Express.Multer.File[],
  ) {
    const imagemPaths = imagens.map(
      (img) => `https://geotoy.onrender.com/uploads/imagens/${img.filename}`,
    );

    const dto: CreateOrderDto = {
      ...body,
      frete: parseFloat(body.frete),
      valorUnitario: parseFloat(body.valorUnitario),
      valorTotal: parseFloat(body.valorTotal),
      tipoFrete: body.tipoFrete ?? null,
      observacao: Array.isArray(body.observacao)
        ? body.observacao
        : [body.observacao],
      imagens: imagemPaths, // ou armazene múltiplas
    };

    console.log('📥 DTO enviado para service:', dto);

    return this.ordersService.create(dto);
  }

  //nota fiscal

  @Post(':id/upload-nota')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/notas',
        filename: (req, file, cb) => {
          const fileExt = path.extname(file.originalname);
          const fileName = `nota_${Date.now()}${fileExt}`;
          cb(null, fileName);
        },
      }),
    }),
  )
  async uploadNotaFiscal(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.path) {
      throw new BadRequestException('Arquivo não enviado');
    }

    // salva o caminho no banco
    return this.ordersService.update(id, { notaFiscalPath: file.path });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    console.log('Payload recebido no PATCH:', updateOrderDto);
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
