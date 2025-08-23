"use client";

export type LocalUser = {
  username: string;
  password: string;
  createdAt: number;
};

const USERS_KEY = "sc_users";
const SESSION_KEY = "sc_session";
const API_KEY_STORAGE = "sc_api_key";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getStoredUsers(): LocalUser[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUser[]) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: LocalUser[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(username: string, password: string): { ok: boolean; error?: string } {
  const users = getStoredUsers();
  const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  if (exists) return { ok: false, error: "Username already exists" };
  const user: LocalUser = { username, password, createdAt: Date.now() };
  users.push(user);
  saveUsers(users);
  setSession(username);
  return { ok: true };
}

export function loginUser(username: string, password: string): { ok: boolean; error?: string } {
  const users = getStoredUsers();
  const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!found) return { ok: false, error: "User not found" };
  if (found.password !== password) return { ok: false, error: "Invalid credentials" };
  setSession(found.username);
  return { ok: true };
}

export function setSession(username: string): void {
  if (!isBrowser()) return;
  const session = { username, loginAt: Date.now() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): { username: string; loginAt: number } | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as { username: string; loginAt: number }) : null;
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getOrCreateApiKey(): string {
  if (!isBrowser()) return "";
  let key = window.localStorage.getItem(API_KEY_STORAGE);
  if (!key) {
    key = generateApiKey();
    window.localStorage.setItem(API_KEY_STORAGE, key);
  }
  return key;
}

export function generateApiKey(): string {
  // simple random string; replace with secure backend later
  const bytes = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return `sc_${bytes}`;
}

export function setApiKey(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(API_KEY_STORAGE, key);
}

export function revokeApiKey(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(API_KEY_STORAGE);
}


