import { createLogger, format, transports, Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import 'winston-daily-rotate-file';

const enum LogLevels {
  info = 'info',
  debug = 'debug',
  error = 'error',
}

const Strings = {
  logsDirectory: './logs',
  logsFileName: 'spyre-crm',
  logsFileLimit: 10,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
};

/**
 * Provides the global logging functionality
 */
@Injectable()
export class LogService {
  private logsFilePath: string;
  private logger: Logger;

  constructor() {
    this.logsFilePath = path.join(Strings.logsDirectory, Strings.logsFileName);

    this.createDirectory();
    this.logger = this.initLogger();
  }

  private createDirectory(): void {
    if (!fs.existsSync(Strings.logsDirectory)) {
      fs.mkdirSync(Strings.logsDirectory);
    }
  }

  private writeLog(msg: string | object, level: LogLevels): void {
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }

    this.logger[level](msg);
  }

  private initLogger(): Logger {
    const winstonLogger = createLogger({
      format: format.combine(
        format.timestamp({
          format: `${Strings.dateFormat} ${Strings.timeFormat}`,
        }),
        format.json(),
      ),
      transports: [
        // using both the console and file outputs
        new transports.Console(),
        new transports.DailyRotateFile({
          filename: `${this.logsFilePath}-%DATE%.log`,
          datePattern: Strings.dateFormat,
          maxFiles: 10,
        }),
      ],
      level: 'debug',
    });

    return winstonLogger;
  }

  info(msg: string | object): void {
    this.writeLog(msg, LogLevels.info);
  }

  debug(msg: string | object): void {
    this.writeLog(msg, LogLevels.debug);
  }

  error(msg: string | object): void {
    this.writeLog(msg, LogLevels.error);
  }
}
