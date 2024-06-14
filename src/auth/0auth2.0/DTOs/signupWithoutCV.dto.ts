import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { CreateJobRoleDto } from './createJobRole.dto';

export class SignupWithoutCVDto {
  @ApiProperty({
    description: 'First Name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last Name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Location',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone Number',
  })
  @IsString()
  @IsNotEmpty() // Phone number is optional
  phone: string;

  @ApiProperty({
    description: 'LinkedIn Link',
  })
  @IsString()
  @IsOptional() // LinkedIn Link is optional
  linkedInLink: string;

  @ApiProperty({
    description: 'Profile Link',
  })
  @IsString()
  @IsOptional() // Profile Link is optional
  profileLink: string;

  @ApiProperty({
    description: 'Targeted role 1',
  })
  @IsString()
  @IsNotEmpty()
  jobTarget1: string;

  @ApiProperty({
    description: 'Targeted role 1',
  })
  @IsString()
  @IsOptional()
  jobTarget2: string;

  @ApiProperty({
    description: 'Education History',
    example:
      "[{educationLevel: '',fieldOfStudy: '',institutionName: '', startDate: '', endDate: ''}]",
  })
  @IsString()
  @IsOptional()
  educationCertificates: string;

  // @ApiProperty({
  //   description: 'Education/Certificate 2',
  // })
  // @IsString()
  // @IsOptional() // Education/Certificate 2 is optional
  // educationCertificate2: string;

  // JSON string. so we can later change it to an array by JSON PARSE
  @ApiProperty({
    description: 'Skills array in form of string',
    example: '["skill1" , "skill2"]',
  })
  @IsString()
  @IsOptional() // Skill 1 is optional
  technicalSkills: string;

  @ApiProperty({
    description: 'Skills array in form of string',
    example: '["skill1" , "skill2"]',
  })
  @IsString()
  @IsOptional() // Skill 1 is optional
  professionalSkills: string;

  // @ApiProperty({
  //   description: 'Skill 2',
  // })
  // @IsString()
  // @IsOptional() // Skill 2 is optional
  // skill2: string;

  // @ApiProperty({
  //   description: 'Skill 3',
  // })
  // @IsString()
  // @IsOptional() // Skill 3 is optional
  // skill3: string;

  @ApiProperty({
    description: 'Additional Notes',
  })
  @IsString()
  @IsOptional() // Additional Notes is optional
  additionalNotes: string;

  @IsOptional()
  @IsArray()
  @ApiProperty({
    type: () => [CreateJobRoleDto],
  })
  jobRoles: CreateJobRoleDto[];
}
