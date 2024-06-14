import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  template_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name: string;


  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  start_date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  end_date: string;

  @ApiProperty()
  @IsString()
  switch_count: string;

  @ApiProperty()
  @IsString()
  email_subject: string;

  @ApiProperty()
  @IsString()
  email_title: string;

  @ApiProperty()
  @IsString()
  reply_to: string;

  @ApiProperty()
  @IsString()
  no_of_emails: string;

  @ApiProperty()
  @IsString()
  interval: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unsubs_text: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  from_emails: string;

  @ApiProperty()
  @IsString()
  groups: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  files: Express.Multer.File;

  oauth_token: string;

  isEdit?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  template_id?: string;
}
