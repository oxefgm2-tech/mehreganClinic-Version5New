import { Request } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

type AuthUser = {
  username: string;
  password: string;
  role: string;
  name: string;
  phone?: string;
  email?: string;
  ownerId?: string;
};

const authSessions = new Map<string, AuthUser>();
const authBootstrapToken = process.env.AUTH_BOOTSTRAP_TOKEN || '';

function configuredAuthUsers(): AuthUser[] {
  try {
    const configuredFile = process.env.AUTH_USERS_FILE || path.resolve(process.cwd(), 'config', 'auth_users.json');
    if (fs.existsSync(configuredFile)) {
      const users = JSON.parse(fs.readFileSync(configuredFile, 'utf-8'));
      if (Array.isArray(users)) return users;
    }
    const raw = process.env.AUTH_USERS_JSON;
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users)) return users;
    }
  } catch {
    console.warn('Ignoring invalid AUTH_USERS_JSON.');
  }
  return authBootstrapToken
    ? [{ username: 'admin', password: authBootstrapToken, role: 'admin', name: 'مدیر کلینیک' }]
    : [];
}

function normalizeIdentity(value: string): string {
  return value.trim()
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');
}

export function sessionUser(req: Request): AuthUser | undefined {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return token ? authSessions.get(token) : undefined;
}

export function createSession(user: AuthUser): string {
  const token = randomUUID();
  authSessions.set(token, user);
  return token;
}

export function deleteSession(token: string): void {
  authSessions.delete(token);
}

export function getAllAuthUsers() {
  return configuredAuthUsers();
}