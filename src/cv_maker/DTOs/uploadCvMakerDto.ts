import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CvMakerAdminUploadUserFileDTO {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  cvType: string;

  @IsOptional()
  @IsString()
  section: string;

  @IsString()
  @IsOptional()
  jobTarget: string;

  @IsString()
  @IsOptional()
  content: string;
}
