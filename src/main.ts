import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('CertificateServiceBootstrap');
  const PORT = process.env.PORT;

  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: Number(PORT),
        },
      },
    );
    
    await app.listen();
    logger.log(`Certificate Service iniciado exitosamente en puerto ${PORT}`);
  } catch (error) {
    logger.error('Error iniciando Certificate Service:', error);
    process.exit(1);
  }
}

bootstrap();

