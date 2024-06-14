/* eslint-disable prettier/prettier */

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// interface ResetPasswordRequest {
//   token: string;
//   newPassword: string;
// }