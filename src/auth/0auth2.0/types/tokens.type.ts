import { ApiProperty } from '@nestjs/swagger';

export class Tokens {
  @ApiProperty({
    description: 'Access token to use in all protected routes',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token to generate new access and refresh tokens',
  })
  refresh_token: string;
}
