import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SmsDTO {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    text: string;
}
