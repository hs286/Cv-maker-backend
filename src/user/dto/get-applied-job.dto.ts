import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class GetAppliedJobDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    userId: string;
}
