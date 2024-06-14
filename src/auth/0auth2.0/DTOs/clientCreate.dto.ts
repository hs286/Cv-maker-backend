import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEmail, IsNumber, IsOptional } from "class-validator";

export class ClientCreateDto {
  @ApiProperty({
    description: "First Name"
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Last Name"
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "Phone Number"
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: "Email Address"
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Sales Person"
  })
  @IsString()
  salesPerson: string;

  @ApiProperty({
    description: "CV Specialist"
  })
  @IsString()
  @IsNotEmpty()
  cvSpecialist: string;

  @ApiProperty({
    description: "Source"
  })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    description: "Target Role"
  })
  @IsString()
  @IsNotEmpty()
  targetRole: string;

  @ApiProperty({
    description: "Sector"
  })
  @IsString()
  @IsNotEmpty()
  sector: string;

  @ApiProperty({
    description: "County"
  })
  @IsString()
  @IsNotEmpty()
  county: string;

  @ApiProperty({
    description: "Salary"
  })
  @IsString()
  @IsNotEmpty()
  salary: string

  @ApiProperty({
    description: "Package",
    required: false
  })
  @IsOptional()
  package?: number;

  @ApiProperty({
    description: "Payment Type"
  })
  @IsString()
  paymentType: string;

  @ApiProperty({
    description: "Services",
    required: false
  })
  // services would be an array of strings
  @IsOptional()
  services?: number[];

  @ApiProperty({
    description: "Referral"
  })
  @IsString()
  referral?: string;

  @ApiProperty({
    description: "Discount"
  })
  @IsOptional()
  @IsString()
  discount: string;
}
