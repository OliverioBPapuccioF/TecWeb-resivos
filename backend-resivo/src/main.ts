import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// form hire eny request from any origin enters to the backend
// then dump all the request to the AppModule
// in this example eny request with the path /resivo or /producto will be handled

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // validates every request body against its DTO (class-validator decorators)
  // whitelist: drops fields that are not in the DTO
  // transform: converts the plain JSON into an instance of the DTO class
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
