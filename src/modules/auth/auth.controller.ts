import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';

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
}
