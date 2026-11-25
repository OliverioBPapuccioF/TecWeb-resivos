import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity.js';
import { ILike, Repository } from 'typeorm';
import { UpdateProductoDto } from './dto/update-producto.dto.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { ResivoService } from '../resivo/resivo.service.js';
import { subtotal } from '../common/dinero.js';
import { validarCamposParaActualizar } from '../common/validaciones.js';

// here it going to return the response of each request
// for example the request of getAll its going to return a list of all producto items

@Injectable()
export class ProductoService {
  private readonly logger = new Logger(ProductoService.name);

  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    private readonly resivoService: ResivoService,
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

  // shape every producto the same way before sending it:
  // flat resivoId (handy for the frontend <select>) and subtotal = cantidad x precio (rounded)
  private formatear(producto: Producto) {
    return {
      ...producto,
      resivoId: producto.resivo.id,
      subtotal: subtotal(producto),
    };
  }

  //getAll: return a list of all producto items (optionally filtered by nombre)
  async getAll(nombre?: string) {
    const filtro = typeof nombre === 'string' ? nombre.trim() : '';
    const productos = await this.consultar(
      this.productoRepository.find({
        where: filtro ? { nombre: ILike(`%${filtro}%`) } : undefined,
        relations: { resivo: true },
      }),
      'No se pudieron obtener los productos',
    );

    return productos.map((producto) => this.formatear(producto));
  }

  //getById: return a single producto item by id
  async getById(id: number) {
    const producto = await this.consultar(
      this.productoRepository.findOne({
        where: { id },
        relations: { resivo: true },
      }),
      'No se pudo obtener el producto',
    );

    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return this.formatear(producto);
  }

  //create: create a new producto item and return it like getById does
  async create(createProductoDto: CreateProductoDto) {
    // 404 "Recibo con id X no encontrado" if the resivo does not exist
    await this.resivoService.getById(createProductoDto.resivoId);
    const { resivoId, ...datos } = createProductoDto;

    const producto = await this.consultar(
      this.productoRepository.save(
        this.productoRepository.create({ ...datos, resivo: { id: resivoId } }),
      ),
      'No se pudo crear el producto',
    );

    return this.getById(producto.id);
  }

  //update: update a single producto item by id
  async update(id: number, updateProductoDto: UpdateProductoDto) {
    validarCamposParaActualizar(updateProductoDto, [
      'nombre',
      'cantidad',
      'precio',
      'resivoId',
    ]);

    // first the producto (404 if it does not exist), then the resivo it moves to (404 if it does not exist)
    await this.getById(id);

    const { resivoId, ...datos } = updateProductoDto;
    if (resivoId !== undefined) {
      await this.resivoService.getById(resivoId);
    }

    await this.consultar(
      this.productoRepository.update(id, {
        ...datos,
        ...(resivoId !== undefined ? { resivo: { id: resivoId } } : {}),
      }),
      'No se pudo actualizar el producto',
    );

    return this.getById(id);
  }

  //delete: delete a single producto item by id
  async delete(id: number) {
    // read it first (404 if it does not exist), to say in the message what was deleted
    const producto = await this.getById(id);

    await this.consultar(
      this.productoRepository.delete(id),
      'No se pudo eliminar el producto',
    );

    return {
      message: `Producto "${producto.nombre}" eliminado correctamente`,
      status: 'success',
    };
  }
}
