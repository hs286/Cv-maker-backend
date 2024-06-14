import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class JobRoleQueryDto {
    @ApiProperty({
        description: "The index of the first role to return. Default is 0.",
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => {
        return Number(value);
    })
    start?: number;

    @ApiProperty({
        description: "The maximum number of roles to return. Default is 60.",
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => {
        return Number(value);
    })
    limit?: number;

    @ApiProperty({
        description: "A keyword to search for in the job title.",
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description:
            "The type of the job. Can be either 0 (master) or 1 (reed). Optional.",
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => {
        return Number(value);
    })
    type?: number;
}
