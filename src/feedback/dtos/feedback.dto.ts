import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    example: 'Great service!',
    required: true,
  })
  @IsNotEmpty({ message: 'feedback is required' })
  @IsString({ message: 'feedback must be a string' })
  feedback: string;
}

export class UpdateFeedbackStatusDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'id is required' })
  @IsNumber({}, { message: 'id must be a number' })
  id: number = 1;

  @ApiProperty({ example: false })
  @IsNotEmpty({ message: 'isDone is required' })
  @IsBoolean({ message: 'isDone must be a boolean value true or false' })
  isDone: boolean = false;
}