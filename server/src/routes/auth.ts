import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { signToken, requireAuth, AuthRequest } from '../middleware/auth';
import { store } from '../lib/store';
import { deliverPasswordReset } from '../lib/password-reset-delivery';

export const authRouter = Router();

const MIN_PASSWORD_LENGTH = 8;
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DiBxNxz0Mqr3vL6E6kRk8B0r3pYC';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function publicUser(user: {
  id: string;
  email: string | null;
  name: string;
  role: 'attendee' | 'organizer';
  avatarUrl: string | null;
  totalSpend: number;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    totalSpend: user.totalSpend,
  };
}

authRouter.post('/register', async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof name !== 'string' ||
    email.trim() === '' ||
    password.trim() === '' ||
    name.trim() === ''
  ) {
    return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Mot de passe trop court (min. ${MIN_PASSWORD_LENGTH} caractères)` });
  }

  const normalizedEmail = normalizeEmail(email);
  if (await store.findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }

  const user = await store.createUser({
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    name,
    role: 'attendee',
  });

  return res.json({ token: signToken(user.id), user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim() === '' ||
    password.trim() === ''
  ) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await store.findUserByEmail(normalizedEmail);
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !passwordMatches) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  return res.json({ token: signToken(user.id), user: publicUser(user) });
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }
  return res.json({ user: publicUser(user) });
});

authRouter.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  const summary = await store.getProfileSummary(req.userId!);
  if (!summary) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }
  return res.json(summary);
});

authRouter.patch('/profile', requireAuth, async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  const { email, name } = req.body ?? {};
  if (
    (email !== undefined && (typeof email !== 'string' || !email.trim())) ||
    (name !== undefined && (typeof name !== 'string' || !name.trim()))
  ) {
    return res.status(400).json({ error: 'Nom ou email invalide' });
  }

  const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : undefined;
  if (normalizedEmail && normalizedEmail !== user.email) {
    const existing = await store.findUserByEmail(normalizedEmail);
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
  }

  const updated = await store.updateUserProfile(user.id, {
    email: normalizedEmail,
    name: typeof name === 'string' ? name : undefined,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  return res.json({ user: updated });
});

authRouter.post('/password-reset/request', async (req, res) => {
  const email = req.body?.email;
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email requis' });
  }

  const user = await store.findUserByEmail(normalizeEmail(email));
  let resetToken: string | undefined;
  if (user?.email) {
    resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    await store.createPasswordResetToken(user.id, tokenHash, new Date(Date.now() + 30 * 60 * 1000));
    await deliverPasswordReset({ email: user.email, name: user.name, token: resetToken });
  }

  return res.status(202).json({
    ok: true,
    ...(process.env.NODE_ENV === 'test' && resetToken ? { resetToken } : {}),
  });
});

authRouter.post('/password-reset/confirm', async (req, res) => {
  const { token, password } = req.body ?? {};
  if (typeof token !== 'string' || !token.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Lien et mot de passe requis' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Mot de passe trop court (min. ${MIN_PASSWORD_LENGTH} caractères)` });
  }

  const tokenHash = createHash('sha256').update(token.trim()).digest('hex');
  const changed = await store.consumePasswordResetToken(tokenHash, await bcrypt.hash(password, 10));
  if (!changed) {
    return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
  }
  return res.json({ ok: true });
});

authRouter.delete('/account', requireAuth, async (req: AuthRequest, res) => {
  const password = req.body?.password;
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Mot de passe requis' });
  }

  const user = await store.findUserById(req.userId!);
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user?.passwordHash || !matches) {
    return res.status(403).json({ error: 'Mot de passe incorrect' });
  }

  await store.deleteUser(user.id);
  return res.status(204).send();
});

authRouter.post('/dev-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Route introuvable' });
  }
  const role = req.body?.role === 'organizer' ? 'organizer' : 'attendee';
  const requestedEmail = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : null;
  const fallbackEmail = role === 'organizer' ? 'organizer@yoticks.dev' : 'jean.dupont@example.com';
  const users = await store.listUsers();
  const user =
    (requestedEmail ? await store.findUserByEmail(requestedEmail) : null) ??
    (await store.findUserByEmail(fallbackEmail)) ??
    users.find((entry) => entry.role === role) ??
    users[0];

  if (!user) {
    return res.status(500).json({ error: 'Aucun utilisateur de démonstration disponible' });
  }

  return res.json({ token: signToken(user.id), user: publicUser(user) });
});
