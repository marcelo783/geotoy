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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

@Post()
create(@Body() createOrderDto: CreateOrderDto) {
  return this.ordersService.create(createOrderDto);
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
    const result = await this.ordersService.processPdf(file.path);
    return result;
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
  })
)
async criarComImagem(
  @Body() body: any,
  @UploadedFiles() imagens: Express.Multer.File[],
) {
  const imagemPaths = imagens.map((img) => `http://localhost:3000/uploads/imagens/${img.filename}`);

  const dto: CreateOrderDto = {
    ...body,
    frete: parseFloat(body.frete),
    valorUnitario: parseFloat(body.valorUnitario),
    valorTotal: parseFloat(body.valorTotal),
    observacao: Array.isArray(body.observacao)
      ? body.observacao
      : [body.observacao],
  imagens: imagemPaths, // ou armazene múltiplas
  };

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


  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
