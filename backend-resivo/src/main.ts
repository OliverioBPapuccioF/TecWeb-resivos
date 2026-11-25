import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ErroresFilter } from './common/errores.filter.js';

// from here any request enters the backend
// and is passed on to the AppModule
// for example, any request with the path /resivo or /producto will be handled there

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: lets the Angular app (another origin, port 4200) call this API from the browser
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  });

  // validates every request body against its DTO (class-validator decorators)
  // whitelist: drops fields that are not in the DTO
  // transform: converts the plain JSON into an instance of the DTO class
  // stopAtFirstError: only one message per field (the first rule that fails)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  // every error leaves with the same shape and in Spanish (see common/errores.filter.ts)
  app.useGlobalFilters(new ErroresFilter());

  // closes the app (and the database connection) when it receives SIGTERM/SIGINT:
  // `docker stop` sends SIGTERM, and without this Docker has to kill it after 10 s
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
