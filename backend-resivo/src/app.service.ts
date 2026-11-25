import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // "API alive" check: the frontend calls GET / to know if the API is up
  getStatus() {
    return { status: 'ok', message: 'API de recibos funcionando' };
  }
}
