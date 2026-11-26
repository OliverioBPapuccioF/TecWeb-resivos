import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ResivoModule } from './resivo/resivo.module.js';
import { ProductoModule } from './producto/producto.module.js';

// here any request from the main entry are going to be handled by the imports or the controllers
// for example if the request is /resivo then the ResivoModule will handle it and vice versa

// connection to Postgres, from environment variables. Two ways:
// - DATABASE_URL (postgresql://user:password@host:port/database): the one Render gives
//   (render.yaml) and the one docker-compose.prod.yml uses
// - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME: development (backend-resivo/.env)
// they are not mixed: in TypeORM, host/port/... would override the parts of the url
const conexion = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'resivo',
    };

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...conexion,
      // if the database does not answer, give up after 3 s (instead of waiting much longer):
      // the request fails fast with a 500 and GET /salud says it is down
      connectTimeoutMS: 3000,
      autoLoadEntities: true,
      // creates/updates the tables when the API starts (also on Render)
      synchronize: true,
    }),
    ResivoModule,
    ProductoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
