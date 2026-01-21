import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {

  const PORT = process.env.PORT || 3003;

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
  console.log(`🛡️ Certificate Service corriendo en puerto ${PORT}`);
}
bootstrap();
