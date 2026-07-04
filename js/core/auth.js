// ============================================================
// auth.js — Sesión y guardia de acceso
// ============================================================
import { getClient } from './db.js';

export async function requireSession() {
  const sb = getClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

export async function getUser() {
  const sb = getClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function logout() {
  const sb = getClient();
  await sb.auth.signOut();
  window.location.href = 'login.html';
}
