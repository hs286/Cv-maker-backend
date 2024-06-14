import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class JobScrapperDto {
  @ApiProperty({
    example: 'Senior Software Engineer',
    description: 'Search Title',
  })
  @IsNotEmpty({ message: 'Please select a target role' })
  searchTitle: string;

  @ApiProperty({ example: 'London', description: 'Location' })
  @IsNotEmpty({ message: 'Please select a location' })
  location: string;

  @IsNumber()
  @ApiProperty({ example: 3, description: 'Number of pages' })
  pages: number;
}
