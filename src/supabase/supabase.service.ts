import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
 public cliente: SupabaseClient;
  constructor() {
    this.cliente = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );
  }

// supabase.service.ts
async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
  const { data, error } = await this.cliente.storage
    .from(bucket)
    .upload(path, file, {
      contentType, // aqui usamos o mimetype
      upsert: true, // sobrescreve se já existir
    });

  if (error) throw error;
  return data;
}

 getPublicUrl(bucket: string, path: string): string {
    const { data } = this.cliente.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

    getClient(): SupabaseClient {
    return this.cliente;
  }

}
