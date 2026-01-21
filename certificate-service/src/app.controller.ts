import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}
  
  @EventPattern('vote.confirmed')
  async handleVoteConfirmed(@Payload() data: any) {
    
    const secret = this.configService.get<string>('INTERNAL_SECRET');
    
    if (!data.token || data.token !== secret) {
      this.logger.warn(`⛔ Intento de acceso no autorizado detectado. Cédula: ${data.cedula || 'desconocida'}`);
      return;
    }

    this.logger.log(`✅ Token válido. Procesando certificado para: ${data.nombres}`);
    
    delete data.token;
    
    await this.appService.procesarCertificado(data);
  }

}
