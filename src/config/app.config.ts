import { registerAs } from '@nestjs/config';

export type AppConfig = {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  primer: {
    apiUrl: string;
    apiKey: string;
  };
};

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      name: process.env.DB_NAME || 'payments',
    },
    primer: {
      apiUrl: process.env.PRIMER_API_URL || 'https://api.sandbox.primer.io',
      apiKey: process.env.PRIMER_API_KEY || '',
    },
  }),
);
