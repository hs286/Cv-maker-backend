import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateCvTypeDto {
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    section: string;

    @ApiProperty()
    @IsOptional()
    standard: boolean;

    @ApiProperty()
    @IsOptional()
    graduate: boolean;

    @ApiProperty()
    @IsOptional()
    academic: boolean;

    @ApiProperty()
    @IsOptional()
    transition: boolean;

    @ApiProperty()
    @IsOptional()
    contractor: boolean;

    @ApiProperty()
    @IsOptional()
    combined: boolean;

    @ApiProperty()
    @IsOptional()
    international: boolean;

    @ApiProperty()
    @IsOptional()
    picture: boolean;

    @ApiProperty()
    @IsOptional()
    executive: boolean;
}
