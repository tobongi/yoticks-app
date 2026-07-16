import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiBaseUrl } from './api-config';

test('uses and normalizes the configured public API URL', () => {
  assert.equal(
    resolveApiBaseUrl({ configuredUrl: ' https://api.yoticks.com/ ', debuggerHost: undefined, isDev: false }),
    'https://api.yoticks.com/api',
  );
  assert.equal(
    resolveApiBaseUrl({ configuredUrl: 'https://api.yoticks.com/api/', debuggerHost: undefined, isDev: false }),
    'https://api.yoticks.com/api',
  );
});

test('uses the Expo debugger host only in development', () => {
  assert.equal(
    resolveApiBaseUrl({ configuredUrl: undefined, debuggerHost: '192.168.1.44:8081', isDev: true }),
    'http://192.168.1.44:4000/api',
  );
});

test('rejects missing production configuration and malformed URLs', () => {
  assert.throws(
    () => resolveApiBaseUrl({ configuredUrl: undefined, debuggerHost: undefined, isDev: false }),
    /EXPO_PUBLIC_API_URL/,
  );
  assert.throws(
    () => resolveApiBaseUrl({ configuredUrl: 'not a url', debuggerHost: undefined, isDev: false }),
    /valid HTTP/,
  );
});

test('rejects insecure production endpoints', () => {
  assert.throws(
    () => resolveApiBaseUrl({ configuredUrl: 'http://api.yoticks.com', debuggerHost: undefined, isDev: false }),
    /HTTPS/,
  );
});
