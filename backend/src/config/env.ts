import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  
  storage: {
    type: 's3' | 'minio';
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint?: string;
    forcePathStyle: boolean;
  };
  
  upload: {
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  
  cors: {
    origin: string;
  };
  
  email?: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const getEnvAsNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

const getEnvAsBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const env: EnvConfig = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnvAsNumber('PORT', 5000),
  apiPrefix: getEnv('API_PREFIX', '/api'),
  
  db: {
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvAsNumber('DB_PORT', 5432),
    name: getEnv('DB_NAME', 'docmanager'),
    user: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', 'postgres'),
    ssl: getEnvAsBoolean('DB_SSL', false),
  },
  
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvAsNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD,
  },
  
  jwt: {
    secret: getEnv('JWT_SECRET'),
    expiresIn: getEnv('JWT_EXPIRES_IN', '15m'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET'),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  
  storage: {
    type: (getEnv('STORAGE_TYPE', 's3') as 's3' | 'minio'),
    region: getEnv('AWS_REGION', 'us-east-1'),
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
    bucketName: getEnv('S3_BUCKET_NAME', 'docmanager-files'),
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: getEnvAsBoolean('S3_FORCE_PATH_STYLE', false),
  },
  
  upload: {
    maxFileSize: getEnvAsNumber('MAX_FILE_SIZE', 104857600), // 100MB
    allowedFileTypes: getEnv('ALLOWED_FILE_TYPES', '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip').split(','),
  },
  
  security: {
    bcryptRounds: getEnvAsNumber('BCRYPT_ROUNDS', 10),
    rateLimitWindowMs: getEnvAsNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    rateLimitMaxRequests: getEnvAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  },
  
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
  },
  
  email: process.env.SMTP_HOST ? {
    host: getEnv('SMTP_HOST'),
    port: getEnvAsNumber('SMTP_PORT', 587),
    user: getEnv('SMTP_USER'),
    password: getEnv('SMTP_PASSWORD'),
    from: getEnv('EMAIL_FROM', 'noreply@docmanager.com'),
  } : undefined,
};

export const isDevelopment = env.nodeEnv === 'development';
export const isProduction = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';
