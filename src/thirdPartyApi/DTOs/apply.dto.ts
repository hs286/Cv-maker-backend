import { ApiProperty } from "@nestjs/swagger";
import {
    IsArray,
    IsEmail,
    IsEmpty,
    IsNotEmpty, IsNumber,
    IsOptional, IsString,
    IsUrl
} from "class-validator";

export class ApplyDTO {
    @ApiProperty({
        description: "Job Urls",
        example: ["https://www.cv-library.co.uk/job/220282693/Senior-Accountant"],
        required: true
    })
    @IsNotEmpty()
    @IsArray()
    @IsUrl({}, { each: true })
    urls: Array<string>;

    @ApiProperty({
        description: "Email",
        example: "mail@example.com",
        required: false
    })
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: "User ID of CV Library",
        example: 123334444,
        required: false
    })
    @IsOptional()
    @IsNumber()
    userId: number;

    @ApiProperty({
        description: "Source of the job",
        example: "Reed",
        required: true
    })
    @IsString()
    @IsOptional()
    source?: string;

    jobTitle?: string;
    jobDescription?: string;
    jobLocation?: string;
    jobSalary?: string;
    jobType?: string;
    jobEmployer?: string;
    jobReference?: string;
}
