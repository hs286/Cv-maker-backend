import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';

import { IndividualServices } from '../enums/individualServices.enum';
import { Type } from 'class-transformer';

export class IndividualServicesCheckoutDTO {
  @ApiProperty({
    description: 'User Choosen Services',
    required: true,
    enum: IndividualServices,
  })
  @IsNotEmpty()
  @IsArray()
  @IsEnum(IndividualServices, { each: true })
  services: Array<IndividualServices>;
}
