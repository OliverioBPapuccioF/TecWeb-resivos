import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Resivo } from './entities/resivo.entity.js';
import { UpdateResivoDto } from './dto/update-resivo.dto.js';
import { CreateResivoDto } from './dto/create-resivo.dto.js';
import { METODOS_PAGO } from './metodo-pago.js';
import { redondear, subtotal } from '../common/dinero.js';
import { validarCamposParaActualizar } from '../common/validaciones.js';

// here it going to return the response of each request
// for example the request of getAll its going to return a list of all resivo items

@Injectable()
export class ResivoService {
  private readonly logger = new Logger(ResivoService.name);

  constructor(
    @InjectRepository(Resivo)
    private readonly resivoRepository: Repository<Resivo>,
  ) {}

  // runs a database query; if the database fails, the real error goes to the console
  // and the client gets a 500 with a clear message
  private consultar<T>(consulta: Promise<T>, mensaje: string): Promise<T> {
    return consulta.catch((error: unknown) => {
      this.logger.error(
        mensaje,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(mensaje);
    });
  }

  private noEncontrado(id: number) {
    return new NotFoundException(`Recibo con id ${id} no encontrado`);
  }

  // shape every resivo the same way before sending it:
  // each producto with its subtotal, and the total of the resivo
  // (getters like `total` are lost when the object is turned into JSON, so they are copied here)
  private formatear(resivo: Resivo) {
    return {
      ...resivo,
      productos: (resivo.productos ?? []).map((producto) => ({
        ...producto,
        subtotal: subtotal(producto),
      })),
      total: resivo.total,
    };
  }

  //getAll: return a list of all resivo items (optionally filtered by nombre)
  async getAll(nombre?: string) {
    const filtro = typeof nombre === 'string' ? nombre.trim() : '';
    const resivos = await this.consultar(
      this.resivoRepository.find({
        where: filtro ? { nombre: ILike(`%${filtro}%`) } : undefined,
        relations: { productos: true },
      }),
      'No se pudieron obtener los recibos',
    );

    return resivos.map((resivo) => this.formatear(resivo));
  }

  //getById: return a single resivo item by id
  async getById(id: number) {
    const resivo = await this.consultar(
      this.resivoRepository.findOne({
        where: { id },
        relations: { productos: true },
      }),
      'No se pudo obtener el recibo',
    );

    if (!resivo) {
      throw this.noEncontrado(id);
    }

    return this.formatear(resivo);
  }

  //create: create a new resivo item and return it like getById does
  async create(createResivoDto: CreateResivoDto) {
    const resivo = await this.consultar(
      this.resivoRepository.save(this.resivoRepository.create(createResivoDto)),
      'No se pudo crear el recibo',
    );

    return this.getById(resivo.id);
  }

  //update: update a single resivo item by id
  async update(id: number, updateResivoDto: UpdateResivoDto) {
    validarCamposParaActualizar(updateResivoDto, [
      'nombre',
      'tiempoCompra',
      'metodoPago',
    ]);

    const result = await this.consultar(
      this.resivoRepository.update(id, updateResivoDto),
      'No se pudo actualizar el recibo',
    );

    if (result.affected === 0) {
      throw this.noEncontrado(id);
    }

    return this.getById(id);
  }

  //delete: delete a single resivo item by id (its productos are deleted too, ON DELETE CASCADE)
  async delete(id: number) {
    // read it first, to say in the message what was deleted
    const resivo = await this.getById(id);

    await this.consultar(
      this.resivoRepository.delete(id),
      'No se pudo eliminar el recibo',
    );

    const cantidad = resivo.productos.length;
    const conProductos =
      cantidad === 0
        ? ''
        : ` (junto con ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'})`;

    return {
      message: `Recibo "${resivo.nombre}" eliminado correctamente${conProductos}`,
      status: 'success',
    };
  }

  //metodosPago: the same list the DTO validates against
  getMetodosPago() {
    return METODOS_PAGO;
  }

  // ---------- estadisticas (home page of the frontend) ----------

  //ultimos: the 5 most recent resivos by purchase date
  async getUltimos() {
    const resivos = await this.consultar(
      this.resivoRepository.find({
        relations: { productos: true },
        order: { tiempoCompra: 'DESC', id: 'DESC' },
        take: 5,
      }),
      'No se pudieron calcular las estadísticas',
    );

    return resivos.map((resivo) => ({
      id: resivo.id,
      nombre: resivo.nombre,
      tiempoCompra: resivo.tiempoCompra,
      total: resivo.total,
    }));
  }

  //metodoPago: how many resivos use each payment method, and which one is used the most
  async getPorMetodoPago() {
    const resivos = await this.consultar(
      this.resivoRepository.find(),
      'No se pudieron calcular las estadísticas',
    );

    // start every method of the list at 0, so the frontend always gets all of them
    const conteo = new Map<string, number>(
      METODOS_PAGO.map((metodo) => [metodo, 0]),
    );
    for (const resivo of resivos) {
      conteo.set(resivo.metodoPago, (conteo.get(resivo.metodoPago) ?? 0) + 1);
    }

    const cantidades = [...conteo].map(([metodoPago, cantidad]) => ({
      metodoPago,
      cantidad,
    }));

    let masUsado: string | null = null;
    let maximo = 0;
    for (const { metodoPago, cantidad } of cantidades) {
      if (cantidad > maximo) {
        masUsado = metodoPago;
        maximo = cantidad;
      }
    }

    return { masUsado, cantidades };
  }

  //porFecha: money spent on each purchase date, oldest first
  async getPorFecha() {
    const resivos = await this.consultar(
      this.resivoRepository.find({
        relations: { productos: true },
        order: { tiempoCompra: 'ASC' },
      }),
      'No se pudieron calcular las estadísticas',
    );

    const grupos = new Map<
      string,
      { fecha: string; total: number; cantidadRecibos: number }
    >();
    for (const resivo of resivos) {
      const fecha = String(resivo.tiempoCompra);
      const grupo = grupos.get(fecha) ?? {
        fecha,
        total: 0,
        cantidadRecibos: 0,
      };
      grupo.total = redondear(grupo.total + resivo.total);
      grupo.cantidadRecibos += 1;
      grupos.set(fecha, grupo);
    }

    return [...grupos.values()];
  }

  //porLocal: money spent on each local (grouped by nombre, ignoring case and extra spaces)
  async getPorLocal() {
    const resivos = await this.consultar(
      this.resivoRepository.find({
        relations: { productos: true },
        order: { id: 'ASC' },
      }),
      'No se pudieron calcular las estadísticas',
    );

    const grupos = new Map<
      string,
      { nombre: string; total: number; cantidadRecibos: number }
    >();
    for (const resivo of resivos) {
      const clave = resivo.nombre.trim().toLowerCase();
      // the name shown is the one of the first resivo loaded for that local
      const grupo = grupos.get(clave) ?? {
        nombre: resivo.nombre.trim(),
        total: 0,
        cantidadRecibos: 0,
      };
      grupo.total = redondear(grupo.total + resivo.total);
      grupo.cantidadRecibos += 1;
      grupos.set(clave, grupo);
    }

    return [...grupos.values()].sort((a, b) => b.total - a.total);
  }
}
