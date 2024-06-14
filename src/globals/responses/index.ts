import { ApiProperty } from '@nestjs/swagger';
import { API_STATUS } from '../enums';

export class PaginationInResponse {
  @ApiProperty({
    description: 'Page of the data',
  })
  page: number;
  @ApiProperty({
    description: 'Limit of no. of entries per page',
  })
  limit: number;
  @ApiProperty({
    description: 'Total no. of entries in the database acc to query',
  })
  total: number;
}

export class ApiResponse<T = any> {
  @ApiProperty()
  status: API_STATUS;
  @ApiProperty()
  message: string;
  @ApiProperty()
  data?: T;
}

export class ApiResponseWithPagination<T = any> {
  @ApiProperty()
  status: API_STATUS;
  @ApiProperty()
  message: string;
  @ApiProperty()
  data: T;
  @ApiProperty()
  pagination: PaginationInResponse;
}


export class ApiResponseWithPagination2<T = any> {
  @ApiProperty()
  status: API_STATUS;
  @ApiProperty()
  message: string;
  @ApiProperty()
  data: T;
  @ApiProperty()
  total: number;
}