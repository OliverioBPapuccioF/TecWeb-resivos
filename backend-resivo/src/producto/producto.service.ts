import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity.js';
import { ILike, Repository } from 'typeorm';
import { UpdateProductoDto } from './dto/update-producto.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { ResivoService } from '../resivo/resivo.service.js';

// here it going to return the response of each request
// for example the request of getAll its going to return a list of all producto items

@Injectable()
export class ProductoService {
    constructor(
        @InjectRepository(Producto) private readonly productoRepository: Repository<Producto>,
        private readonly ResivoService: ResivoService,
    ) {}

    //getAll: return a list of all producto items
    getAll(nombre?: string) {
        return this.productoRepository.find({
            where: nombre ? { nombre: ILike(`%${nombre}%`) } : undefined,
            relations: { resivo: true },
        }).catch((error) => {
            throw new Error('Error fetching producto items: ' + error.message);
        });
    }

    searchByName(nombre: string) {
        if (!nombre?.trim()) {
            throw new BadRequestException(
                'El parámetro nombre es obligatorio y no puede estar vacío',
            );
        }

        return this.productoRepository.find({
            where: { nombre: ILike(`%${nombre.trim()}%`) },
            relations: { resivo: true },
        }).catch((error) => {
            throw new Error('Error searching producto items by name: ' + error.message);
        });
    }

    //getById: return a single producto item by id
    async getById(id: number) {
        const producto = await this.productoRepository.findOne({
            where: { id },
            relations: { resivo: true },
        });

        if (!producto) {
            throw new NotFoundException(`Producto con id ${id} no encontrado.`);
        }

        return producto;
    }

    //create: create a new producto item
    async create(createProductoDto: CreateProductoDto) {
        await this.ResivoService.getById(createProductoDto.resivoId);
        const { resivoId, ...datos } = createProductoDto;

        return this.productoRepository.save({
            ...datos,
            resivo: { id: resivoId },
        }).catch((error) => {
            throw new InternalServerErrorException(
                'Error al crear el producto',
            );
        });
    }

    //update: update a single producto item by id
    async update(id: number, updateProductoDto: UpdateProductoDto) {
        const { resivoId, ...datos } = updateProductoDto;

        if (resivoId !== undefined) {
            await this.ResivoService.getById(resivoId);
        }

        const result = await this.productoRepository
            .update(id, {
                ...datos,
                ...(resivoId !== undefined
                    ? { resivo: { id: resivoId } }
                    : {}),
            })
            .catch((error) => {
                throw new InternalServerErrorException(
                    'Error al actualizar el producto en la base de datos',
                );
            });

        if (result.affected === 0) {
            throw new NotFoundException(`Producto con id ${id} no encontrado.`);
        }

        return this.getById(id);
    }

    //delete: delete a single producto item by id
    async delete(id: number) {
        const producto = await this.getById(id);

        if (!producto) {
            throw new NotFoundException(`Producto con id ${id} no encontrado.`);
        }

        await this.productoRepository.delete(id).catch(() => {
            throw new InternalServerErrorException(
                'Error al eliminar el producto de la base de datos',
            );
        });

        return {
            message: `Producto ${producto.nombre} eliminado exitosamente.`,
            status: 'success',
        };
    }
}
