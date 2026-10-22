import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Resivo } from './entities/resivo.entity.js';
import { UpdateResivoDto } from './dto/update-resivo.dto.js';
import { CreateResivoDto } from './dto/create-resivo.dto.js';

// here it going to return the response of each request
// for example the request of getAll its going to return a list of all resivo items

@Injectable()
export class ResivoService {
    constructor(
        @InjectRepository(Resivo) private readonly resivoRepository: Repository<Resivo>
    ) {}

    //getAll: return a list of all resivo items
    getAll(nombre?: string) {
        return this.resivoRepository.find({
            where: nombre ? { nombre: ILike(`%${nombre}%`) } : undefined,
            relations: { productos: true },
        }).then((resivos) => resivos.map((resivo) => ({
            ...resivo,
            total: resivo.total,
        }))).catch((error) => {
            throw new Error('Error fetching resivo items: ' + error.message);
        });
    }

    searchByName(nombre: string) {
        if (!nombre?.trim()) {
            throw new BadRequestException(
                'El parámetro nombre es obligatorio y no puede estar vacío',
            );
        }

        return this.resivoRepository.find({
            where: { nombre: ILike(`%${nombre.trim()}%`) },
            relations: { productos: true },
        }).then((resivos) => resivos.map((resivo) => ({
            ...resivo,
            total: resivo.total,
        }))).catch((error) => {
            throw new Error('Error searching resivo items by name: ' + error.message);
        });
    }

    //getById: return a single resivo item by id
    async getById(id: number) {
        const resivo = await this.resivoRepository.findOne({
            where: { id },
            relations: { productos: true },
        });

        if (!resivo) {
            throw new NotFoundException(`Resivo con id ${id} no encontrado.`);
        }

        return {
            ...resivo,
            total: resivo.total,
        };
    }

    //create: create a new resivo item
    create(createResivoDto: CreateResivoDto) {
        return this.resivoRepository.save(createResivoDto).catch((error) => {
            throw new Error('Error creating resivo: ' + error.message);
        });
    }

    //update: update a single resivo item by id
    async update(id: number, updateResivoDto: UpdateResivoDto) {
        const result = await this.resivoRepository
            .update(id, updateResivoDto)
            .catch((error) => {
                throw new InternalServerErrorException(
                    'Error al actualizar el resivo en la base de datos',
                );
            });

        if (result.affected === 0) {
            throw new NotFoundException(`Resivo con id ${id} no encontrado`);
        }

        return this.getById(id);
    }

    //delete: delete a single resivo item by id
    async delete(id: number) {
        try {
            const result = await this.resivoRepository.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException(`Resivo con id ${id} no encontrado`);
            }

            return { message: `Resivo con id ${id} eliminado correctamente`, status: 'success' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'No se pudo eliminar el resivo',
            );
        }
    }
}
