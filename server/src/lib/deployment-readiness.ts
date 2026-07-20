import { posix, win32 } from 'node:path';

type ProductionEnvironment = Record<string, string | undefined>;

function isAbsolutePath(value: string): boolean {
  return posix.isAbsolute(value) || win32.isAbsolute(value);
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/$/, '');
}

export function validateProductionEnvironment(environment: ProductionEnvironment): void {
  if (environment.NODE_ENV !== 'production') return;

  if ((environment.JWT_SECRET?.trim().length ?? 0) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production.');
  }

  if (!environment.PASSWORD_RESET_WEBHOOK_URL || !isHttpsUrl(environment.PASSWORD_RESET_WEBHOOK_URL)) {
    console.warn(
      '[YoTicks] PASSWORD_RESET_WEBHOOK_URL is not a public HTTPS endpoint. Password-reset delivery will fail until it is configured.',
    );
  }

  const databaseFile = environment.YOTICKS_DB_FILE?.trim();
  if (!databaseFile || !isAbsolutePath(databaseFile)) {
    throw new Error('YOTICKS_DB_FILE must be an absolute persistent path in production.');
  }

  if (environment.RAILWAY_ENVIRONMENT) {
    const volumePath = environment.RAILWAY_VOLUME_MOUNT_PATH?.trim();
    if (!volumePath) {
      throw new Error('RAILWAY_VOLUME_MOUNT_PATH is required for persistent production storage.');
    }
    const normalizedDatabase = normalizePath(databaseFile);
    const normalizedVolume = normalizePath(volumePath);
    if (normalizedDatabase !== normalizedVolume && !normalizedDatabase.startsWith(`${normalizedVolume}/`)) {
      throw new Error('YOTICKS_DB_FILE must be stored inside RAILWAY_VOLUME_MOUNT_PATH.');
    }
  }
}
