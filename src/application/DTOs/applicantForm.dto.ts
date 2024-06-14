import { ApiProperty } from "@nestjs/swagger";

export class ApplicantFormDTO {
  @ApiProperty({ description: "First name" })
  firstName: string;

  @ApiProperty({ description: "Last name" })
  lastName: string;

  @ApiProperty({ description: "User ID", required: false })
  userId?: number;

  @ApiProperty({ description: "Email address", required: false })
  email?: string;

  @ApiProperty({ description: "Generated email address", required: false })
  generatedEmail?: string;

  @ApiProperty({ description: "Phone number" })
  phone: string;

  @ApiProperty({ description: "County" })
  county: string;

  @ApiProperty({ description: "Postcode" })
  postcode: string;

  @ApiProperty({ description: "Town" })
  town: string;

  @ApiProperty({ description: "Desired job" })
  desiredJob: string;

  @ApiProperty({ description: "Desired minimum salary" })
  desiredMinSalary: number;

  @ApiProperty({ description: "Salary range" })
  salaryRange: string;

  @ApiProperty({ description: "Job type" })
  jobType: string;

  @ApiProperty({ description: "Cover content" })
  coverContent?: string;

  @ApiProperty( { description: "CV file" })
  cv: Express.Multer.File;
}
