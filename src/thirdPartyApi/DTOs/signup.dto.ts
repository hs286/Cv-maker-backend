import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  fname: string;

  @IsString()
  @IsNotEmpty()
  lname: string;

  @IsString()
  @IsNotEmpty()
  postcode: string;

  @IsString()
  @IsNotEmpty()
  current_job: string;

  @IsNumber()
  @IsNotEmpty()
  salary: number;

  @IsNumber()
  @IsOptional()
  jobtype: number;

  @IsString()
  @IsOptional()
  cover_content: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
