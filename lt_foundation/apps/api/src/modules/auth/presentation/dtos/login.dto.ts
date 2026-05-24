import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'engenheiro@ltfoundation.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
