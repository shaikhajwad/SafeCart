import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001').split(','),
  checkoutBaseUrl: process.env.CHECKOUT_BASE_URL || 'http://localhost:3001',
}));
