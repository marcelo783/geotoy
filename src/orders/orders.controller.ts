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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
