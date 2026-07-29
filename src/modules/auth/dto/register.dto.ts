import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {

    @ApiProperty({example:'Alejandro Vargas'})
    @IsString({message:'El nombre debe ser un string o cadena de texto'})
    @IsNotEmpty({message:'El nombre es obligatorio'})
    nombre!: string;

    @ApiProperty({example:'correo123@correo.com'})
    @IsEmail({}, {message:'El correo debe ser un correo valido'})
    @IsNotEmpty({message:'El correo es obligatorio'})
    correo!: string;

    @ApiProperty({example:'CharlieFlow'})
    @IsString({message:'El username debe ser un string o cadena de texto'})
    @IsNotEmpty({message:'El username es obligatorio'})
    username!: string;
   
    @ApiProperty({example:'password1234' , minLength:8})
    @IsString()
    @IsNotEmpty({message:'La contraseña es obligatoria'})
    @MinLength(8, {message:'La contraseña debe tener al menos 8 caracteres'})
    password!: string;

}
