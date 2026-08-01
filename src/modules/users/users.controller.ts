import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Users')
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) {}

    @Public()
    @Throttle({default:{ttl: 60000, limit: 7}})
    @Get('check-username')
    @ApiOperation({ summary: 'Verificar si un username esta disponible' })
    async verifyEmail(
    @Query('username') username: string
    ) {
            return this.usersService.checkIfUsernameExists(username);
    }
}
