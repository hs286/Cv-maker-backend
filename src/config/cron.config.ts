import { registerAs } from '@nestjs/config';

export default registerAs('cron', () => ({
  cronJobSchedule: process.env.CRON_JOB_SCHEDULE,
}));
