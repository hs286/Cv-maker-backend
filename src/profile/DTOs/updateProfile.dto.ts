import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEmail, IsArray, IsNotEmpty, IsNumber } from "class-validator";

export class PublicationDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  publisher: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  url: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  publishedAt: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;
}

export class PatentDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  number: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  date: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;
}

export class MembershipDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  issuer: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;
}

export class ProjectDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  result?: string;
}

export class WorkHistoryDTO {
  @ApiProperty()
  @IsString()
  jobTitle: string;

  @ApiProperty()
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  responsibilities?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  achievements?: string[];

  @ApiProperty({ type: [ProjectDTO] })
  @IsArray()
  projects: ProjectDTO[];
}

export class EducationDTO {

  @ApiProperty()
  @IsString()
  institutionName: string;

  @ApiProperty()
  @IsString()
  educationLevel: string;

  @ApiProperty()
  @IsString()
  fieldOfStudy: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;
}

export class TrainingDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  institutionName: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;
}

export class CertificateDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  issuer: string;

  @ApiProperty()
  @IsString()
  year: string;
}

export class VolunteeringDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  organizationName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class AwardDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  institution: string;

  @ApiProperty()
  @IsString()
  year: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class UserProfileUpdateDTO {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  portfolio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileSummary?: string;

  @ApiProperty({ type: [WorkHistoryDTO], required: false })
  @IsOptional()
  @IsArray()
  workHistory?: WorkHistoryDTO[];

  @ApiProperty({ type: [EducationDTO], required: false })
  @IsOptional()
  @IsArray()
  educations?: EducationDTO[];

  @ApiProperty({ type: [TrainingDTO], required: false })
  @IsOptional()
  @IsArray()
  trainings?: TrainingDTO[];

  @ApiProperty({ type: [CertificateDTO], required: false })
  @IsOptional()
  @IsArray()
  certificates?: CertificateDTO[];

  @ApiProperty({ type: [VolunteeringDTO], required: false })
  @IsOptional()
  @IsArray()
  volunteerings?: VolunteeringDTO[];

  @ApiProperty({ type: [PublicationDTO], required: false })
  @IsOptional()
  @IsArray()
  publications?: PublicationDTO[];

  @ApiProperty({ type: [PatentDTO], required: false })
  @IsOptional()
  @IsArray()
  patents?: PatentDTO[];

  @ApiProperty({ type: [ProjectDTO], required: false })
  @IsOptional()
  @IsArray()
  projects?: ProjectDTO[];

  @ApiProperty({ type: [MembershipDTO], required: false })
  @IsOptional()
  @IsArray()
  memberships?: MembershipDTO[];

  @ApiProperty({ type: [AwardDTO], required: false })
  @IsOptional()
  @IsArray()
  awards?: AwardDTO[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  professionalSkills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  technicalSkills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
