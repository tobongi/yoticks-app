export type ApiConfigInput = {
  configuredUrl?: string;
  debuggerHost?: string;
  isDev: boolean;
};

function normalizeConfiguredUrl(rawUrl: string, isDev: boolean): string {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTP(S) URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTP(S) URL.');
  }
  if (!isDev && url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must use HTTPS in production.');
  }

  const base = url.toString().replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export function resolveApiBaseUrl({ configuredUrl, debuggerHost, isDev }: ApiConfigInput): string {
  if (configuredUrl?.trim()) {
    return normalizeConfiguredUrl(configuredUrl, isDev);
  }

  if (!isDev) {
    throw new Error('EXPO_PUBLIC_API_URL is required for production builds.');
  }

  const host = debuggerHost?.split(':')[0]?.trim() || '127.0.0.1';
  return `http://${host}:4000/api`;
}
