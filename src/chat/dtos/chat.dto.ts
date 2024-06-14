import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEmail, IsIn, ValidateNested, IsNumber, Min } from 'class-validator';


export class UserDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email of the user',
    required: true,
    type: String,
  })
  email: string;

  @IsNotEmpty()
  @IsIn(['client', 'admin'])
  @ApiProperty({
    description: 'Role of the user (client or admin)',
    required: true,
    type: String,
    enum: ['client', 'admin'],
  })
  role: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID',
    required: true,
    type: String,
  })
  userId: string;
}


export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message content',
    required: true,
  })
  content: string;
}

export class UpdateMessageDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Updated message content',
    required: false,
  })
  content?: string;
}

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number;
}
