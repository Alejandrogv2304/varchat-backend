import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/types/authenticated-user';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Get('verify-email')
    @ApiOperation({ summary: 'Verificar el correo por medio del token' })
    async verifyEmail(
        @Query('token') token: string,
        @Res({passthrough: true}) res: Response
    ) {
        return this.authService.verifyEmail(token, res);
    }

     //Con el http code OK, se hace que responda con un 200 y no con un 201 de creado porque no se esta creando un recurso, se esta validando algo
    //Y el passthrough: true permite que se pueda modificar la respuesta para el http code
    @Throttle({default:{ttl: 60000, limit: 4}})
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    async login(
        @Body() dto: LoginDto, 
        @Res({passthrough: true}) res: Response
    ) {
        return this.authService.login(dto, res);
    }

    //Se le pasa el accesstoken en el header de bearer token
    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cerrar sesión e invalidar el token' })
    async logout(
        @CurrentUser() user: AuthenticatedUser,
        @Res({passthrough: true}) res: Response
    ) {
        return this.authService.logout(user.id, res);
    }

    @Get('me')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Obtener información del usuario actual' })
    me(@CurrentUser() user: AuthenticatedUser) {
        return {
            id: user.id,
            name: user.nombre,
            email: user.correo,
            username: user.username,
        }
    }

    @Throttle({default:{ttl: 60000, limit: 3}})
    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }


    @Throttle({default:{ttl: 60000, limit: 3}})
    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Restablecer contraseña' })
    async resetPassword( @Body() dto: ResetPasswordDto ) {
        return this.authService.resetPassword(dto.token, dto.password);
    }
}
