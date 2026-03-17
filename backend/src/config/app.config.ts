import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001,http://localhost:3002,http://localhost:3003').split(','),
}));
