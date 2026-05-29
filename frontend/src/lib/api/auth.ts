"use client";

import {
  api,
  setToken,
  setStoredUser,
  clearSession,
  getStoredUser,
} from "./client";

export async function login(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });

  if (res.session?.access_token) {
    setToken(res.session.access_token);
  }
  if (res.user) {
    setStoredUser(res.user);
  }
  return res;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    /* ignore */
  }
  clearSession();
}

export async function forgotPassword(email: string) {
  return api.post("/auth/forgot-password", { email });
}

export async function resetPassword(access_token: string, new_password: string) {
  return api.post("/auth/reset-password", { access_token, new_password });
}

export async function fetchMe() {
  try {
    const res = await api.get("/auth/me");
    if (res.user) setStoredUser(res.user);
    return res.user;
  } catch {
    return null;
  }
}

export function currentUser() {
  return getStoredUser();
}
