import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'change_me_in_production',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  refreshExpiresInSeconds: 30 * 24 * 60 * 60,
}));
