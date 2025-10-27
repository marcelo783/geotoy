import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  async uploadImagem(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'geotoy',
          transformation: [{ width: 1200, crop: 'limit' }],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Erro no upload da imagem 🌩️'));

          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(stream);
    });
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const uploads = files.map((file) => this.uploadImagem(file));
    const results = await Promise.all(uploads);
    return results.map((res) => res.secure_url);
  }
}
