import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) {}

    @Public()
    @Get('check-username')
    @ApiOperation({ summary: 'Verificar si un username esta disponible' })
    async verifyEmail(
    @Query('username') username: string
    ) {
            return this.usersService.checkIfUsernameExists(username);
    }
}
