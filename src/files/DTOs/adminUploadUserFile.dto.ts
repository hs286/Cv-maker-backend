import { IsNotEmpty, IsUUID } from 'class-validator';

export class AdminUploadUserFileDTO {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
