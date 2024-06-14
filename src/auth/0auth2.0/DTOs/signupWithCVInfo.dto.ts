import { ApiProperty } from "@nestjs/swagger";
import {
    IsEmail,
    IsNotEmpty,
    IsStrongPassword,
    IsString,
    IsOptional
} from "class-validator";

export class SignupWithCVInfoDto {
    @ApiProperty({
        description: "User ID"
    })
    @IsString()
    @IsOptional()
    userId?: string;

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
        description: "Email"
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: "Phone Number"
    })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({
        description: "Password"
    })
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @ApiProperty({
        description: "county"
    })
    @IsString()
    @IsNotEmpty()
    county: string;

    @ApiProperty({
        description: "postcode"
    })
    @IsString()
    @IsNotEmpty()
    postcode: string;

    @ApiProperty({
        description: "location"
    })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiProperty({
        description: "Town"
    })
    @IsString()
    @IsOptional()
    town?: string;

    @ApiProperty({
        description: "Job Target"
    })
    @IsString()
    @IsOptional()
    jobTarget?: string;
}
