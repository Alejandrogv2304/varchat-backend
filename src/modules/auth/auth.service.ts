import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly emailService: EmailService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

     async register(dto: RegisterDto) {

        //Verificamos que el correo y el username no estén en uso
         const existingUser = await this.usersService.findByEmail(dto.correo);

         if(existingUser) {
            throw new ConflictException('El correo electrónico ya está en uso');
         }
         const existingUsername = await this.usersService.findByUsername(dto.username);

         if(existingUsername){
            throw new ConflictException('El username ya está en uso');
         }

         //El 12 es el número de rondas o de iteraciones que aplicara el algoritmo que usa bcrypt, usando mezclas, estructuras del algoritmo y el hash y salt.
         const passwordHash = await bcrypt.hash(dto.password, 12);

         //Armamos el token de verificacion usando una clave de 32 bytes hexadecimales
         const verificationToken = crypto.randomBytes(32).toString('hex');
         const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

         const user = await this.usersService.create({
            correo: dto.correo,
            nombre: dto.nombre,
            username: dto.username,
            passwordHash,
            verificationToken,
            verificationTokenExpiresAt,
         });

         void this.emailService.sendVerificationEmail(user.correo, verificationToken);

         return {
            message: 'Usuario registrado exitosamente. Por favor, revisa tu correo electrónico para verificar tu cuenta.',
         }
    }
}
