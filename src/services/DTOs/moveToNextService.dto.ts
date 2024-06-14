import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MoveToNextServiceDTO {
  @ApiProperty({
    description: 'User ID to whom the service is to be moved',
    example: '5f4e7b3b-3b7b-4b7b-8b7b-7b3b7b3b7b3b',
    required: true,
  })
  @IsString()
  userId: string;
}
