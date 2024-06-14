import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class JobCreateFormDto {
    @ApiProperty({ description: "Job Title" })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: "Job Type" })
    @IsNumber()
    @IsNotEmpty()
    type: number;
}
