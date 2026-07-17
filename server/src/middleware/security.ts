import cors from 'cors';
import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

export function makeRateLimiter(opts: Partial<Options> & { windowMs: number; max: number }): RateLimitRequestHandler {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, réessayez plus tard' },
    ...opts,
  });
}

export const globalLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isTest || !isProduction ? 100_000 : 600,
});

export const authLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isTest || !isProduction ? 100_000 : 15,
  skipSuccessfulRequests: true,
});

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const configuredOrigins = parseList(process.env.CORS_ORIGINS);
const developmentOrigins = [
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://[::1]:19006',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const defaultOrigins = [
  process.env.CLIENT_URL,
  'https://yoticks.vercel.app',
  ...(!isProduction ? developmentOrigins : []),
].filter((origin): origin is string => Boolean(origin));

const allowedOrigins = new Set([...configuredOrigins, ...defaultOrigins]);

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    callback(new Error('Origin non autorisée par la politique CORS'));
  },
  credentials: true,
});
