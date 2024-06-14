import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString
} from "class-validator";

export class ApplyFormDto {

  @ApiProperty({
    description: "User ID"
  })
  @IsNotEmpty()
  userId: number;


  @ApiProperty({
    description: "Email Address"
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "County for job apply"
  })
  @IsString()
  @IsNotEmpty()
  county: string;

  @ApiProperty({
    description: "Job Titles for job apply"
  })
  @IsArray()
  @ArrayNotEmpty()
  jobTitles: string[];

}
