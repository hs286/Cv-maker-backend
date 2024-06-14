// UserIdQueryDto.ts

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UserIdQueryDto {
  @ApiProperty({
    description: `User ID for the user from whom we need to retrieve files.`,
    example: `11f774ae-0270-45af-86e2-c6791208ce90`,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
