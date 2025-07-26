import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

interface EmailTemplatePayload {
  cliente: string;
  mensagem: string;
  gifUrl: string;
  codigoRastreamento?: string;
  mostrarResumo?: boolean;
  produto?: string;
  descricao?: string;
  valorUnitario?: string;
  frete?: string;
  valorTotal?: string;
  saudacao?: string;
  statusTexto?: string;
  gerarEtapas?: string;
}

export function gerarTemplateEmail(payload: EmailTemplatePayload) {
  // ✅ Caminho seguro independente do build
const filePath = path.join(process.cwd(), 'src/templates/email/email-template.html');


  // ✅ Garante que o arquivo exista
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template não encontrado em: ${filePath}`);
  }

  const htmlRaw = fs.readFileSync(filePath, 'utf-8');
  const template = handlebars.compile(htmlRaw);

  return template({
    cliente: payload.cliente,
    mensagem: payload.mensagem,
    gifUrl: payload.gifUrl,
    codigoRastreamento: payload.codigoRastreamento,
    mostrarResumo: payload.mostrarResumo ?? false,
    produto: payload.produto ?? '',
    descricao: payload.descricao ?? '',
    valorUnitario: payload.valorUnitario ?? '',
    frete: payload.frete ?? '',
    valorTotal: payload.valorTotal ?? '',
    saudacao: payload.saudacao || '',
    statusTexto: payload.statusTexto || '',
    gerarEtapas: payload.gerarEtapas || '',
  });
}
