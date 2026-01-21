import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly configService: ConfigService) {}

  async procesarCertificado(data: any) {
    try {
      const fechaEmision = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
      const pdfBuffer = await this.generarPdf(data, fechaEmision);
      await this.enviarEmail(data, pdfBuffer);
      this.logger.log(`📧 Correo enviado a ${data.email}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando certificado`, error);
    }
  }
  private generarPdf(data: any, fecha: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Diseño simple
      doc.fontSize(20).text('CERTIFICADO DE VOTACIÓN', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Nombre: ${data.nombres}`);
      doc.text(`Cédula: ${data.cedula}`);
      doc.text(`Fecha generación certificado: ${fecha}`);
      doc.text('Recinto: ' + (data.recinto || 'N/A'));
      doc.end();
    });
  }

  private async enviarEmail(data: any, pdfBuffer: Buffer) {
    const transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false, // true para puerto 465, false para otros
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    await transporter.sendMail({
      from: `"Voto Electrónico" <noreply@sevotec.com>`,
      // from: `"Voto Electrónico" <${this.configService.get('SMTP_USER')}>`,
      to: data.email,
      subject: 'Certificado de Votación SEVOTEC',
      text: `Hola ${data.nombres}, adjunto tu certificado.`,
    attachments: [{ filename: `Certificado SEVOTEC ${data.cedula}.pdf`, content: pdfBuffer }],
    });
  }
}
