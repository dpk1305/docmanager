import { Router } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { env, isProduction } from '../config/env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rowCount) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    const hash = await bcrypt.hash(password, env.security.bcryptRounds);
    const result = await client.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, hash, 'user']
    );
    const user = result.rows[0];
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: `${env.apiPrefix}/auth/refresh`,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ user, accessToken });
    return;
  } catch (_err) {
    res.status(500).json({ error: 'Registration failed' });
    return;
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password, code } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name, email, password_hash, role, created_at, two_factor_enabled, two_factor_secret FROM users WHERE email=$1', [email]);
    if (!result.rowCount) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    if (user.two_factor_enabled) {
      const { authenticator } = await import('otplib');
      const valid = authenticator.verify({ token: code || '', secret: user.two_factor_secret });
      if (!valid) {
        res.status(401).json({ error: '2FA required' });
        return;
      }
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    delete user.password_hash;
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: `${env.apiPrefix}/auth/refresh`,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user, accessToken });
    return;
  } catch (_err) {
    res.status(500).json({ error: 'Login failed' });
    return;
  } finally {
    client.release();
  }
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(400).json({ error: 'Missing refreshToken' });
    return;
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken(payload);
    res.json({ accessToken });
    return;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
});

router.post('/2fa/setup', async (req, res) => {
  const client = await pool.connect();
  try {
    const { user } = req.body;
    const userId = user?.sub;
    if (!userId) {
      res.status(400).json({ error: 'Missing user' });
      return;
    }
    const { authenticator } = await import('otplib');
    const secret = authenticator.generateSecret();
    const u = await client.query('UPDATE users SET two_factor_secret=$1 WHERE id=$2 RETURNING email', [secret, userId]);
    if (!u.rowCount) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const emailAddr = u.rows[0].email;
    const url = authenticator.keyuri(emailAddr, 'DocManager', secret);
    res.json({ otpauth: url });
    return;
  } finally {
    client.release();
  }
});

router.post('/2fa/enable', async (req, res) => {
  const client = await pool.connect();
  try {
    const { user, code } = req.body;
    const userId = user?.sub;
    if (!userId || !code) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }
    const row = await client.query('SELECT two_factor_secret FROM users WHERE id=$1', [userId]);
    if (!row.rowCount) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const { authenticator } = await import('otplib');
    const valid = authenticator.verify({ token: code, secret: row.rows[0].two_factor_secret });
    if (!valid) {
      res.status(401).json({ error: 'Invalid code' });
      return;
    }
    await client.query('UPDATE users SET two_factor_enabled=TRUE WHERE id=$1', [userId]);
    res.json({ status: 'ok' });
    return;
  } finally {
    client.release();
  }
});

router.post('/forgot-password', async (_req, res) => {
  res.status(202).json({ status: 'ok' });
  return;
});

export default router;
