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

    // Envia e-mail automático de confirmação
    if (savedOrder.email) {
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido Recebido - Geotoy</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style type="text/css">
        /* Client-specific Styles & Resets */
        body, table, td, a, p {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            mso-height-rule: exactly; /* For Outlook */
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            border-collapse: collapse !important;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        a {
            text-decoration: none;
        }
        /* General Body & Wrapper */
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            background-color: #f8fafc;
        }
        .ExternalClass {
            width: 100%;
        }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100%;
        }
        /* Remove iOS blue links */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        /* Responsive Styles */
        @media screen and (max-width: 650px) {
            .email-wrapper {
                width: 100% !important;
                max-width: 100% !important;
                border-radius: 0 !important;
            }
            .main-content, .footer {
                padding: 20px !important;
            }
            .header img {
                max-width: 150px !important;
            }
            /* Mobile: Badge do "pedido recebido" e client-name */
            .badge-container td {
                display: block !important;
                width: 100% !important;
                text-align: center !important;
                padding-bottom: 10px !important;
            }
            .badge {
                padding: 8px 20px !important; /* Diminuído para mobile */
                font-size: 14px !important; /* Diminuído para mobile */
            }
            .client-name {
                text-align: center !important;
                font-size: 26px !important; /* Aumentado para mobile */
            }
            /* Mobile: Div dos ícones */
            .icone-item {
                display: block !important;
                width: 100% !important;
                max-width: 250px !important; /* Largura diminuída para mobile */
                margin: 0 auto 15px !important;
                padding: 15px !important;
            }
            .icone-item img {
                max-width: 40px !important;
                margin-bottom: 10px !important;
            }

            /* Progress Cards Mobile */
            .progress-steps-table {
                width: 100% !important; /* Garante que a tabela ocupe 100% */
                display: block !important; /* Permite que a tabela se empilhe */
            }
            .progress-steps-table tr {
                display: block !important; /* Faz com que cada linha se comporte como bloco */
            }
            .progress-card-cell {
                width: 100% !important;
                display: block !important;
                padding-bottom: 15px !important; /* Espaço entre os cards */
            }
            .progress-card {
                text-align: left !important;
                padding: 15px !important;
                display: table !important; /* Faz o card se comportar como uma mini-tabela */
                width: 100% !important;
            }
            .progress-number-cell {
                display: table-cell !important;
                vertical-align: middle !important;
                width: 40px !important;
                padding-right: 15px !important;
            }
            .progress-content-cell {
                display: table-cell !important;
                vertical-align: middle !important;
            }
            .progress-card.active::after {
                content: none !important; /* Oculta a borda vertical no mobile */
            }
            .mensagem-final {
                padding: 20px 15px !important;
                font-size: 15px !important;
            }
        }
    </style>
    </head>
<body style="height:100% !important; margin:0; padding:0; width:100% !important; mso-line-height-rule:exactly; background-color:#f8fafc;">
    <center style="width:100%; background-color:#f8fafc;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" style="border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
            <tr>
                <td align="center" valign="top" style="padding: 20px 0;">
                    <table class="email-wrapper" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 700px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);">
                        <tr>
                            <td align="center" valign="top">
                                <table class="header" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 0; text-align: center; position: relative;">
                                    <tr>
                                        <td style="padding: 1rem; text-align: center;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                                <tr>
                                                    <td height="4" style="background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6); font-size: 0; line-height: 0; mso-line-height-rule: exactly;">&nbsp;</td>
                                                </tr>
                                            </table>
                                            <img src="https://i.postimg.cc/vZ7q8w62/Camada-1.png" alt="Logo Geotoy" width="180" style="max-width: 180px; height: auto; display: block; margin: 0 auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                                            </td>
                                    </tr>
                                </table>

                                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                    <tr>
                                        <td class="main-content" style="padding: 30px;">
                                            <table class="badge-container" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td class="column-left" valign="middle" style="padding-bottom: 0px; text-align: center;">
                                                        <span class="badge" style="display: inline-block; background: linear-gradient(90deg, #ec4899, #8b5cf6); color: white; padding: 8px 20px; border-radius: 30px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);">PEDIDO RECEBIDO</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="column-right" valign="middle" style="text-align: center; padding-top: 10px;">
                                                        <p class="client-name" style="color: #8b5cf6; font-size: 26px; font-weight: 700; margin: 0;">Olá, ${savedOrder.cliente}!</p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #475569;">
                                                🎉 Boa notícia chegando! 🎉
Recebemos seu pedido e ele já está entrando na nossa linha de produção!<br>
                                                 aqui na <span style="color: #ec4899; font-weight: 600;">Geotoy</span>,  cada toy art é feito à mão, com alma, tinta e aquele toque insano de criatividade que a gente AMA.

Pode se preparar... vem arte braba por aí! 🔥🖌️
                                            </p>

                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 30px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); position: relative; border: 3px solid #f1f5f9;">
                                                <tr>
                                                    <td style="padding: 0;">
                                                        <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGlxMnlrZWUzdnFkZms2NWs2dXJxdHdpZHE4Nmx4YjE3ZHFxNnB1MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/11sBLVxNs7v6WA/giphy.gif" alt="Processo criativo Geotoy" width="700" style="width: 100%; height: auto; max-height: 300px; object-fit: cover; display: block;">
                                                        <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(15, 23, 42, 0.8); color: white; padding: 5px 15px; border-radius: 20px; font-size: 13px; font-weight: 500;">ARTE EM PROGRESSO</div>
                                                    </td>
                                                </tr>
                                            </table>

                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 2px dashed #ec4899; border-radius: 15px; padding: 25px; margin: 30px 0; background-color: #fdf2f8; text-align: left; position: relative; overflow: hidden;">
                                                <tr>
                                                    <td style="padding: 25px; text-align: left;">
                                                        <div style="position: absolute; top: 0; left: 0; width: 5px; height: 100%; background: linear-gradient(180deg, #ec4899, #8b5cf6);">&nbsp;</div>
                                                        <h3 style="text-align: center; font-size: 20px; margin-bottom: 20px; color: #be185d; font-weight: 700; position: relative;">
                                                            ✧ Resumo do Pedido ✧
                                                            <div style="display: block; width: 80px; height: 3px; background: linear-gradient(90deg, #ec4899, #8b5cf6); margin: 10px auto 0; border-radius: 3px;">&nbsp;</div>
                                                        </h3>
                                                        <p style="margin: 12px 0; font-size: 15px; color: #1e293b; position: relative; padding-left: 25px;">
                                                            <span style="position: absolute; left: 0; top: 0; color: #ec4899; font-size: 24px;">&bull;</span>
                                                            <strong style="color: #be185d;">Produto:</strong> ${savedOrder.produto}
                                                        </p>
                                                        <p style="margin: 12px 0; font-size: 15px; color: #1e293b; position: relative; padding-left: 25px;">
                                                            <span style="position: absolute; left: 0; top: 0; color: #ec4899; font-size: 24px;">&bull;</span>
                                                            <strong style="color: #be185d;">Descrição:</strong> ${savedOrder.observacao || 'Nenhuma observação adicionada'}
                                                        </p>
                                                        
                                                        <p style="margin: 12px 0; font-size: 15px; color: #1e293b; position: relative; padding-left: 25px;">
                                                            <span style="position: absolute; left: 0; top: 0; color: #ec4899; font-size: 24px;">&bull;</span>
                                                            <strong style="color: #be185d;">Valor Unitário:</strong> R$ ${Number(savedOrder.valorUnitario).toFixed(2)}
                                                        </p>
                                                        <p style="margin: 12px 0; font-size: 15px; color: #1e293b; position: relative; padding-left: 25px;">
                                                            <span style="position: absolute; left: 0; top: 0; color: #ec4899; font-size: 24px;">&bull;</span>
                                                            <strong style="color: #be185d;">Frete:</strong> R$ ${Number(savedOrder.frete).toFixed(2)}
                                                        </p>
                                                        <p class="total" style="font-weight: 700; font-size: 18px; color: #10b981; margin-top: 15px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                                                            <strong style="color: #10b981;">Valor Total:</strong> R$ ${Number(savedOrder.valorTotal).toFixed(2)}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                          

                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 40px 0 30px;">
                                                <tr>
                                                    <td style="padding: 0; text-align: center;">
                                                        <h3 class="progress-title" style="font-size: 20px; color: #0f172a; margin-bottom: 25px; text-align: center; font-weight: bold; position: relative; padding-bottom: 10px;">
                                                            Acompanhe o progresso do seu pedido
                                                            <div style="display: block; width: 100px; height: 3px; background: linear-gradient(90deg, #ec4899, #8b5cf6); margin: 10px auto 0; border-radius: 3px;">&nbsp;</div>
                                                        </h3>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 0;">
                                                        <table class="progress-steps-table" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="width: 100%; border-collapse: collapse;">
                                                            <tr>
                                                                <td class="progress-card-cell" valign="top" style="padding: 0 7.5px 15px 7.5px; width: 25%;">
                                                                    <table class="progress-card active" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: #fdf2f8; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #ec4899; position: relative; overflow: hidden; box-shadow: 0 10px 20px rgba(236, 72, 153, 0.1);">
                                                                        <tr>
                                                                            <td class="progress-number-cell" style="padding: 0;">
                                                                                <div class="progress-number" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: #ec4899; color: white; font-weight: bold; font-size: 18px; line-height: 40px; text-align: center; margin-bottom: 15px;">1</div>
                                                                            </td>
                                                                            <td class="progress-content-cell" style="padding: 0; text-align: center;">
                                                                                <div class="progress-name" style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 5px;">Recebido</div>
                                                                                <div class="progress-status" style="font-size: 14px; color: #64748b; font-style: italic;">Status atual</div>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                                <td class="progress-card-cell" valign="top" style="padding: 0 7.5px 15px 7.5px; width: 25%;">
                                                                    <table class="progress-card" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                                                                        <tr>
                                                                            <td class="progress-number-cell" style="padding: 0;">
                                                                                <div class="progress-number" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: #cbd5e1; color: white; font-weight: bold; font-size: 18px; line-height: 40px; text-align: center; margin-bottom: 15px;">2</div>
                                                                            </td>
                                                                            <td class="progress-content-cell" style="padding: 0; text-align: center;">
                                                                                <div class="progress-name" style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 5px;">Produção</div>
                                                                                <div class="progress-status" style="font-size: 14px; color: #64748b; font-style: italic;">Próxima etapa</div>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                                <td class="progress-card-cell" valign="top" style="padding: 0 7.5px 15px 7.5px; width: 25%;">
                                                                    <table class="progress-card" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                                                                        <tr>
                                                                            <td class="progress-number-cell" style="padding: 0;">
                                                                                <div class="progress-number" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: #cbd5e1; color: white; font-weight: bold; font-size: 18px; line-height: 40px; text-align: center; margin-bottom: 15px;">3</div>
                                                                            </td>
                                                                            <td class="progress-content-cell" style="padding: 0; text-align: center;">
                                                                                <div class="progress-name" style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 5px;">Finalizado</div>
                                                                                <div class="progress-status" style="font-size: 14px; color: #64748b; font-style: italic;">Em breve</div>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                                <td class="progress-card-cell" valign="top" style="padding: 0 7.5px 15px 7.5px; width: 25%;">
                                                                    <table class="progress-card" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                                                                        <tr>
                                                                            <td class="progress-number-cell" style="padding: 0;">
                                                                                <div class="progress-number" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: #cbd5e1; color: white; font-weight: bold; font-size: 18px; line-height: 40px; text-align: center; margin-bottom: 15px;">4</div>
                                                                            </td>
                                                                            <td class="progress-content-cell" style="padding: 0; text-align: center;">
                                                                                <div class="progress-name" style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 5px;">Enviado</div>
                                                                                <div class="progress-status" style="font-size: 14px; color: #64748b; font-style: italic;">Em breve</div>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 40px 0 20px; padding: 25px; background:#fdf2f8; border-radius: 15px; border-left: 4px solid #8b5cf6; text-align: center;">
                                                <tr>
                                                    <td style="padding: 0;">
                                                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px; color: #0f172a;">Estamos muito felizes por você fazer parte da família Geotoy!</p>
                                                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px; color: #0f172a;">Fique de olho no seu e-mail para acompanhar cada etapa desta criação exclusiva.</p>
                                                        
                                                        <p class="signature" style="font-weight: 700; color: #0f172a; margin-top: 15px; font-size: 18px;">Com carinho, Equipe Geotoy 🎨✨</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <table class="footer" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="text-align: center; font-size: 13px; color: #64748b; padding: 25px 20px; background: #0f172a;">
                                    <tr>
                                        <td style="padding: 0;">
                                            <div class="footer-logo" style="margin-bottom: 15px;">
                                                <img src="https://i.postimg.cc/9QHgjQzq/cropped-A-1.png" alt="Geotoy Logo" width="50" style="max-width: 50px; margin: 0 auto; display: block; filter: brightness(0) invert(1); opacity: 0.8;">
                                            </div>
                                            <div class="social-links" style="margin: 15px 0;">
                                                <a href="#" title="Instagram" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background: #1e293b; border-radius: 50%; line-height: 36px; color: white; text-decoration: none; font-weight: bold; text-align: center;">IG</a>
                                                <a href="#" title="Facebook" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background: #1e293b; border-radius: 50%; line-height: 36px; color: white; text-decoration: none; font-weight: bold; text-align: center;">FB</a>
                                                <a href="#" title="TikTok" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background: #1e293b; border-radius: 50%; line-height: 36px; color: white; text-decoration: none; font-weight: bold; text-align: center;">TT</a>
                                                <a href="#" title="WhatsApp" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background: #1e293b; border-radius: 50%; line-height: 36px; color: white; text-decoration: none; font-weight: bold; text-align: center;">WA</a>
                                            </div>
                                            <div class="copyright" style="font-size: 12px; margin-top: 20px; color: #94a3b8; line-height: 1.6;">
                                                © 2024 - Geotoy LTDA - CNPJ 42.767.755/0001-66<br>
                                                Transformamos toy arts em obras de arte únicas, criadas com paixão e criatividade.<br>
                                                <span style="font-size: 11px; opacity: 0.7;">Esta mensagem é destinada exclusivamente ao seu destinatário.</span>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>`;

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
        console.warn(
          `⚠️ Falha ao enviar e-mail de boas-vindas: ${err.message}`,
        );
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
        path: path.resolve(file.path), // ✅ caminho absoluto
      })) || [];

    const html = `
    <div>
      <h2>Olá, ${ordem.cliente}!</h2>
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
      attachments,
    );
  }
}
