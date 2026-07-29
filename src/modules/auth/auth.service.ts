import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
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

    async verifyEmail(token: string, res: Response) {
        const user = await this.usersService.findByVerificationToken(token);

        if(!user || !user.verificationToken){
            throw new BadRequestException('Token de verificación inválido');
        }

        //Aquí la condición es que si existe la fecha de expiracion y es anterior a la fecha actual, se lanza el error
        if(
            user.verificationTokenExpiresAt && 
            user.verificationTokenExpiresAt < new Date()
        ){  
            throw new BadRequestException('El token de verificación ha expirado. Solicite uno nuevo');
        }

        //Ya se verifico el usuario, entonces cambiamos el estado y ponemos nulo los campos que apoyaban este proceso
        await this.usersService.update(user.id,{
            isVerified: true,
            verificationToken: null,
            verificationTokenExpiresAt: null,
        });

        //Hacemos lo mismo que cuando se logea el usuario
        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            message: 'Correo electrónico verificado exitosamente',
            accessToken: tokens.accessToken,
            user:{
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        }

    }

}
