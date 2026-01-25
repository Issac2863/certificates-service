import { Controller, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InternalApiKeyGuard } from './guards/internalApiKey.guard';
import { EnvelopeOpenerInterceptor } from './interceptors/envelopeOpener.interceptor';

/**
 * Controlador principal del servicio de certificados.
 * Maneja eventos de votos confirmados y procesa la generación de certificados.
 * 
 * @security Protegido por InternalApiKeyGuard para comunicación interna.
 * @security Usa EnvelopeOpenerInterceptor para descifrar datos encriptados.
 */
@UseGuards(InternalApiKeyGuard)
@UseInterceptors(EnvelopeOpenerInterceptor)
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
  ) {}

  /**
   * Maneja el evento 'vote.confirmed' para procesar certificados de votación.
   * 
   * @param data - Datos del voto confirmado (nombres, cedula, email, recinto)
   * @returns Resultado del procesamiento del certificado
   */
  @EventPattern('vote.confirmed')
  async handleVoteConfirmed(@Payload() data: any): Promise<any> {
    try {
      this.logger.log(`Procesando evento vote.confirmed para cédula: ${data.cedula}`);
      
      const resultado = await this.appService.procesarCertificado(data);
      
      if (resultado.success) {
        this.logger.log(`Certificado procesado exitosamente para ${data.cedula}`);
      } else {
        this.logger.warn(`Error procesando certificado para ${data.cedula}: ${resultado.message}`);
      }
      
      return resultado;
    } catch (error) {
      this.logger.error(`Error inesperado procesando certificado para ${data.cedula}:`, error);
      return {
        success: false,
        message: 'Error interno del servicio'
      };
    }
  }
}
