import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdatePersonalInfoDto {
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
    @IsOptional()
    firstName?: string;

    @ApiProperty({
        description: "Last Name"
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: "Phone number of the user"
    })
    phone?: string;

    @IsOptional()
    @IsEmail()
    @ApiProperty({
        description: "Email of the user"
    })
    email?: string;

    @IsOptional()
    tempEmail?: string;

    @IsOptional()
    tempPhone?: string;

    @IsOptional()
    isPhoneVerified?: boolean;

    @IsOptional()
    isEmailVerified?: boolean;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: "Location"
    })
    location?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: "Post code"
    })
    postcode?: string;

    @IsOptional()
    @IsUrl()
    @ApiProperty({
        description: "Portfolio Link"
    })
    profileLink?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: "Profile Summary"
    })
    profileSummary?: string;
}
