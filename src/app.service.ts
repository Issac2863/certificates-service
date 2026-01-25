import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';

/**
 * Interfaz para los datos del certificado de votación.
 */
interface CertificateData {
  nombres: string;
  cedula: string;
  email: string;
  recinto?: string;
}

/**
 * Interfaz para la respuesta del procesamiento de certificados.
 */
interface ProcessResult {
  success: boolean;
  message: string;
}

/**
 * Servicio principal para la generación y envío de certificados de votación.
 * Genera PDFs personalizados y los envía por email usando Resend.
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.logger.log('Servicio de certificados inicializado con Resend');
  }

  /**
   * Procesa un certificado de votación: genera PDF y lo envía por email.
   * 
   * @param data - Datos del votante para generar el certificado
   * @returns Resultado del procesamiento indicando éxito o fallo
   */
  async procesarCertificado(data: CertificateData): Promise<ProcessResult> {
    try {
      // Validar datos requeridos
      if (!data.nombres || !data.cedula || !data.email) {
        throw new Error('Datos incompletos: nombres, cédula y email son requeridos');
      }

      this.logger.log(`Iniciando procesamiento de certificado para ${data.nombres} (${data.cedula})`);
      
      const fechaEmision = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
      const pdfBuffer = await this.generarPdf(data, fechaEmision);

      await this.enviarEmail(data, pdfBuffer);

      this.logger.log(`Certificado procesado y enviado exitosamente a ${data.email}`);

      return {
        success: true,
        message: 'Certificado generado y enviado correctamente'
      };
    } catch (error) {
      this.logger.error(`Error procesando certificado para ${data.cedula || 'N/A'}: ${error.message}`, error.stack);

      return {
        success: false,
        message: error.message || 'Error interno al procesar certificado'
      };
    }
  }

  /**
   * Genera un PDF del certificado de votación con los datos del votante.
   * 
   * @param data - Datos del votante
   * @param fecha - Fecha de emisión del certificado
   * @returns Buffer del PDF generado
   * @private
   */
  private generarPdf(data: CertificateData, fecha: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {        
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
        doc.on('error', (error) => {
          this.logger.error(`Error generando PDF para ${data.cedula}:`, error);
          reject(error);
        });

        // Diseño del certificado
        doc.fontSize(20).font('Helvetica-Bold')
           .text('CERTIFICADO DE VOTACIÓN', { align: 'center' });
        doc.moveDown(2);
        
        doc.fontSize(14).font('Helvetica')
           .text(`Nombre: ${data.nombres}`);
        doc.moveDown(0.5);
        doc.text(`Cédula de Identidad: ${data.cedula}`);
        doc.moveDown(0.5);
        doc.text(`Fecha de emisión: ${fecha}`);
        doc.moveDown(0.5);
        doc.text(`Recinto de votación: ${data.recinto || 'N/A'}`);
        doc.moveDown(2);
        
        doc.fontSize(12).font('Helvetica-Oblique')
           .text('Este documento certifica la participación ciudadana en el proceso electoral.', 
                 { align: 'center' });
        
        doc.end();
      } catch (error) {
        this.logger.error(`Error iniciando generación de PDF para ${data.cedula}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Envía el certificado de votación por email usando Resend.
   * 
   * @param data - Datos del votante
   * @param pdfBuffer - Buffer del PDF generado
   * @throws Error si falla el envío del email
   * @private
   */
  private async enviarEmail(data: CertificateData, pdfBuffer: Buffer): Promise<void> {
    try {      
      const { data: emailData, error } = await this.resend.emails.send({
        from: 'SEVOTEC <onboarding@resend.dev>',
        to: [data.email],
        subject: 'Certificado de Votación SEVOTEC',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; text-align: center;">Certificado de Votación</h2>
            <p>Estimado/a <strong>${data.nombres}</strong>,</p>
            <p>Nos complace informarle que su participación en el proceso electoral ha sido registrada exitosamente.</p>
            <p>Adjunto a este correo encontrará su certificado oficial de votación en formato PDF.</p>
            <p style="margin-top: 30px;">Gracias por cumplir con su deber cívico y contribuir a la democracia.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              SEVOTEC - Sistema Electoral Verificable y Transparente<br>
              Este es un mensaje automático, por favor no responda.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `Certificado_Votacion_${data.cedula}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (error) {
        this.logger.error(`Error de Resend enviando email a ${data.email}:`, error);
        throw new Error(`Error del servicio de email: ${error.message}`);
      }

      this.logger.log(`Certificado enviado exitosamente a ${data.email} con ID: ${emailData?.id}`);
    } catch (error) {
      this.logger.error(`Excepción enviando email a ${data.email}:`, error);
      throw new Error(`Error enviando certificado: ${error.message}`);
    }
  }
}
