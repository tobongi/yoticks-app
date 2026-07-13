export type AppRole = 'attendee' | 'organizer';

type EntryRouteOptions = {
  seenTutorial: boolean;
  token: string | null;
  role?: AppRole | null;
};

type PostAuthRouteOptions = {
  redirect?: string | null;
  role?: AppRole | null;
};

export function getSignedInRoute(role?: AppRole | null) {
  return role === 'organizer' ? '/(organizer)' : '/(tabs)';
}

export function getEntryRoute({ seenTutorial, token, role }: EntryRouteOptions) {
  if (!seenTutorial) {
    return '/onboarding';
  }

  if (token) {
    return getSignedInRoute(role);
  }

  return '/auth/login';
}

export function getPostAuthRoute({ redirect, role }: PostAuthRouteOptions) {
  const normalizedRedirect = typeof redirect === 'string' ? redirect.trim() : '';
  if (normalizedRedirect) {
    return normalizedRedirect;
  }

  return getSignedInRoute(role);
}

