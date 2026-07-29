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

    async findByEmailWithPassword(correo: string): Promise<Usuario | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.correo = :correo', { correo })
            .getOne();
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

     async findByVerificationToken(token: string) {

        return this.usersRepository.findOne({
            where: { verificationToken: token }
        });
    }



    async update(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
        const user = await this.usersRepository.preload({
            id,
            ...data,
        });

        if (!user) {
            return null;
        }

        return this.usersRepository.save(user);
    }
    //  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    //     const [user] = await db
    //     .update(users)
    //     .set({...data, updatedAt: new Date()})
    //     .where(eq(users.id, id))
    //     .returning();
    //     return user;
    // }

}
