import { ApiProperty } from "@nestjs/swagger";
import {
    IsEmail,
    IsOptional,
    IsString,
    IsStrongPassword
} from "class-validator";

export class UpdateCredentialDto {
    @ApiProperty({
        description: "New Email"
    })
    @IsOptional()
    @IsEmail()
    newEmail?: string;

    @ApiProperty({
        description: "Current Password to Update"
    })
    @IsOptional()
    @IsString()
    currentPassword?: string;

    @ApiProperty({
        description: "New Password"
    })
    @IsOptional()
    @IsStrongPassword()
    newPassword?: string;
}
