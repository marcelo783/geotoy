// src/ordens/pdf-upload.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';

@Injectable()
export class PdfUploadService {
  async extractDataFromPdf(filePath: string): Promise<any> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: 'ordem.pdf', // nome arbitrário
      contentType: 'application/pdf',
    });

    try {
      const response = await axios.post('http://localhost:8000/extract', form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity, // importante para evitar erro com arquivos grandes
      });

      return response.data;
    } catch (err) {
      console.error('❌ Erro ao enviar PDF para o serviço Python:', err?.response?.data || err.message);
      throw new Error('Falha ao extrair dados do PDF');
    }
  }
}
