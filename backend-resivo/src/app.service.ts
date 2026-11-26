import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

// how long GET /salud waits for the database before saying it is down
const LIMITE_MS = 3000;

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  // GET /: the API process is alive. It does NOT look at the database on purpose:
  // Docker (healthcheck) and Render (healthCheckPath) use it, and restarting the API
  // does not fix a database that is down
  getStatus() {
    return { status: 'ok', message: 'API de recibos funcionando' };
  }

  // GET /salud: the API and the database. Runs a minimal query (SELECT 1) with a time limit:
  // 200 if the database answers, 503 (service unavailable) if it does not
  async getSalud() {
    let temporizador: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, rechazar) => {
          temporizador = setTimeout(
            () => rechazar(new Error(`sin respuesta en ${LIMITE_MS} ms`)),
            LIMITE_MS,
          );
        }),
      ]);
      return { api: 'ok', baseDeDatos: 'ok' };
    } catch (error) {
      this.logger.warn(
        `La base de datos no responde: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException({
        message: 'La base de datos no responde',
        error: 'Service Unavailable',
        api: 'ok',
        baseDeDatos: 'caida',
      });
    } finally {
      clearTimeout(temporizador);
    }
  }
}
