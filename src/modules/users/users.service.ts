import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/user.entity';

@Injectable()
export class UsersService {

    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(Usuario)
        private readonly usersRepository: Repository<Usuario>
    ) {}

    async findById(id: string): Promise<Usuario | null> {
        return this.usersRepository.findOne({
            where: { id }
        });
    }

    async findByEmail(correo: string): Promise<Usuario | null> {
        return this.usersRepository.findOne({
            where: { correo }
        });
    }

    async findByUsername(username: string): Promise<Usuario | null> {
        return this.usersRepository.findOne({
            where: { username }
        });
    }

    async create(user: Partial<Usuario>): Promise<Usuario> {
        const newUser = this.usersRepository.create(user);
        return this.usersRepository.save(newUser);
    }

}
