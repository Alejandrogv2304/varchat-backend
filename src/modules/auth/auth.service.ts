import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import type { Response } from 'express';
import type { AuthenticatedUser } from 'src/common/types/authenticated-user';
import { LoginDto } from './dto/login.dto';

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

    async login(dto: LoginDto, res: Response){
        const user = await this.usersService.findByEmailWithPassword(dto.correo);

         if(!user){
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

        if(!passwordMatch){
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if(!user.isVerified){
            throw new UnauthorizedException('Por favor, verifica tu correo electrónico antes de iniciar sesión');
        }

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            user:{
                id: user.id,
                email: user.correo,
                name: user.nombre,
                username: user.username
            }
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
                email: user.correo,
                name: user.nombre,
                username: user.username,
            }
        }

    }

     //Este metodo se va a encargar de generar los tokens haciendo uso de la libreria jwtService, que es un servicio de NestJS que nos permite generar y verificar tokens JWT.
    //Son dos tokens, el de acceso de duración corta y el refresh que dura más tiempo y se almacena en la cookie
    private async generateTokens(user: AuthenticatedUser) {
        const payload = {
            sub: user.id,
            email: user.correo,
            username: user.username,
        };
        const accessToken = await this.jwtService.signAsync(payload,{
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        });

        const refreshToken = await this.jwtService.signAsync(payload,{
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });

        return { 
            accessToken, 
            refreshToken 
        };
    }

      //Con este metodo generamos el hash del refresh token y lo guardamos en la base de datos, para luego poder compararlo cuando el usuario haga una solicitud de refresh token.
    private async saveRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash });
    }

    //Con este metodo establecemos la cookie del refresh token.
    private setRefreshTokenCookie(res: Response, refreshToken: string) {
        const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')!;
        const refreshMaxAge = ms(refreshExpiresIn);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: refreshMaxAge,
        })
    }

    //Metodo para cerrar sesion, eliminando el hash del refresh token de DB para que no se puedan generar mas refresh tokens y borrando la cookie.
     async logout(userId:string, res: Response){
        await this.usersService.update(userId, { refreshTokenHash: null });
        res.clearCookie('refreshToken')
        return {
            message:'Sesión cerrada correctamente'
        }
    }

    //Metodo para solicitar el correo del colvidé mi contraseña
    async forgotPassword(email:string){
        const user = await this.usersService.findByEmail(email);

        if(!user){
            return{
                message: 
                'Si el correo electrónico está registrado, se enviará un enlace de restablecimiento de contraseña'
            }
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await this.usersService.update(user.id, {
            resetToken,
            resetTokenExpiresAt,
        });

        void this.emailService.sendPasswordResetEmail(user.correo, resetToken);
        
        return{
            message: 
            'Si el correo electrónico está registrado, se enviará un enlace de restablecimiento de contraseña'
        }
    }

    //Metodo para reestablecer la contraseña, verificando el token y la fecha de expiración
    async resetPassword(token:string, newPassword:string){
        const user = await this.usersService.findByResetToken(token);
        
        if(!user || !user.resetToken){
            throw new BadRequestException('Token de restablecimiento de contraseña inválido');
        }

        if(
            user.resetTokenExpiresAt && 
            user.resetTokenExpiresAt < new Date()
        ){
            throw new BadRequestException('El token de restablecimiento de contraseña ha expirado. Solicite uno nuevo');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await this.usersService.update(user.id, {
            passwordHash,
            resetToken: null,
            resetTokenExpiresAt: null,
        })

        return{
            message: 'Contraseña restablecida exitosamente. Ahora puede iniciar sesión',
        }
    }
}
