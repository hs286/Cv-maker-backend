import { ApiProperty } from '@nestjs/swagger';
import { IsEnum,IsBoolean  } from 'class-validator';

import { CurrentStatus, HaveCV } from '../enums/helpMeQuestions.enum';

export class HelpChoosePlanDTO {
  @ApiProperty({
    description: 'Current Status Of user',
    required: true,
    enum: CurrentStatus,
  })
  @IsEnum(CurrentStatus)
  currentStatus: CurrentStatus;

  @ApiProperty({
    description: 'User has cv or not',
    required: true,
    enum: HaveCV,
  })
  @IsEnum(HaveCV)
  haveCV: HaveCV;

  @ApiProperty({
    description: 'User needs cover letter',
    required: true,
  })

  @IsBoolean()
  needCoverLetter: boolean;

  @ApiProperty({
    description: 'User needs LinkedIn Optimization',
    required: true,
  })
  @IsBoolean()
  needLinkedInOpt: boolean;

  @ApiProperty({
    description: 'User needs Tailored Applications',
    required: true,
  })
  @IsBoolean()
  tailoredApplications: boolean;

  @ApiProperty({
    description: 'User needs preparation',
    required: true,
  })
  @IsBoolean()
  needPreparation: boolean;

  @ApiProperty({
    description: 'User needs CV circulation to 15000 employers',
    required: true,
  })
  @IsBoolean()
  cvCirculation: boolean;
}
