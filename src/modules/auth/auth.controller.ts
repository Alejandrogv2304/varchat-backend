import { Body, Controller, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }
}
