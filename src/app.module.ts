import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { KeyVaultService } from './security/keyVault.service';

/**
 * Módulo principal del servicio de certificados.
 * Gestiona la generación y envío de certificados de votación mediante PDF y email.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    KeyVaultService
  ],
})
export class AppModule {}
