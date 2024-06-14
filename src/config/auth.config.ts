import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  atSecret: process.env.AT_SECRET,
  atExpiry: process.env.AT_EXPIRY,
  rtSecret: process.env.RT_SECRET,
  rtExpiry: process.env.RT_EXPIRY,
  verificationSecret: process.env.VERIFICATION_SECRET,
  verificationExpiry: process.env.VERIFICATION_EXPIRY,
}));
