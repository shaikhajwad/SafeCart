import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://safecart:safecart@localhost:5432/safecart',
  ssl: process.env.DATABASE_SSL === 'true',
}));
