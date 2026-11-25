import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// global exception filter: every error leaves the API with the same shape
// { statusCode, message, error } and with the message in Spanish
@Catch()
export class ErroresFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // anything that is not an HttpException is a bug or a database failure:
    // the detail goes to the console, the client gets a generic message
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
      });
      return;
    }

    const statusCode = exception.getStatus();
    const cuerpo = exception.getResponse();
    let message =
      typeof cuerpo === 'string'
        ? cuerpo
        : (cuerpo as { message?: string | string[] }).message;

    // errors that Nest throws by itself, in English
    if (
      statusCode === HttpStatus.NOT_FOUND &&
      typeof message === 'string' &&
      message.startsWith('Cannot ')
    ) {
      message = `La ruta ${request.method} ${request.path} no existe`;
    } else if (
      statusCode === HttpStatus.BAD_REQUEST &&
      typeof message === 'string' &&
      message.includes('JSON')
    ) {
      // Nest turns the body-parser SyntaxError into a 400 with the English text (all of them mention JSON)
      message = 'El body no es un JSON válido';
    }

    response.status(statusCode).json({
      statusCode,
      message: message ?? exception.message,
      error: (cuerpo as { error?: string }).error ?? exception.name,
    });
  }
}
