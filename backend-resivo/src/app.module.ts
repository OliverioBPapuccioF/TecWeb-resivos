import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ResivoModule } from './resivo/resivo.module.js';
import { ProductoModule } from './producto/producto.module.js';

// here any request from the main entry are going to be handled by the imports or the controllers
// for example if the request is /resivo then the ResivoModule will handle it and vice versa

// connection to Postgres: each value comes from an environment variable
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'resivo',
      // registers every entity that a module declares with TypeOrmModule.forFeature([...])
      autoLoadEntities: true,
      // creates/updates the tables from the entities (ok for the TP, real projects use migrations)
      synchronize: true,
    }),
    ResivoModule,
    ProductoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
