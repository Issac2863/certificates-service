import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY') || 're_MQv5eWkh_FaHYnrmfgaZJtfax4d7yGSim');
  }

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
    try {
      const { data: emailData, error } = await this.resend.emails.send({
        from: 'SEVOTEC <onboarding@resend.dev>',
        to: [data.email],
        subject: 'Certificado de Votación SEVOTEC',
        html: `
        <p>Hola <strong>${data.nombres}</strong>,</p>
        <p>Adjunto encontrarás tu certificado de votación oficial.</p>
        <p>Gracias por cumplir con tu deber cívico.</p>
        `,
        attachments: [
          {
            filename: `Certificado SEVOTEC ${data.cedula}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (error) {
        this.logger.error('Error enviando email con Resend:', error);
        throw new Error(error.message);
      }

      this.logger.log(`Email enviado con ID: ${emailData?.id}`);
    } catch (error) {
      this.logger.error('Excepción al enviar email:', error);
      throw error;
    }
  }
}
