import { IsNotEmpty, IsString } from "class-validator";

export class CvLibSignupDTO {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  postcode: string;

  @IsString()
  @IsNotEmpty()
  desiredJob: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
