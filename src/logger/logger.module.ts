import { Module, Global } from '@nestjs/common';

import { LogService } from './';

@Global()
@Module({
  providers: [LogService],
  exports: [LogService],
})
export class LoggerModule {}
