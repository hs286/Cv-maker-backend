import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { VerificationType } from "../enums";

export class OtpDTO {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    code: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    email?: string;

    @ApiProperty()
    @IsOptional()
    type?: VerificationType;
}
