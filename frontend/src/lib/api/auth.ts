"use client";

import {
  api,
  setToken,
  setStoredUser,
  clearSession,
  getStoredUser,
} from "./client";

export async function login(email: string, password: string) {
  console.log("🔵 [login] เริ่มเรียก API");
  const res = await api.post("/auth/login", { email, password });
  console.log("🟢 [login] response จาก backend:", res);
  console.log("🟢 [login] res.session:", res.session);
  console.log(
    "🟢 [login] res.session?.access_token:",
    res.session?.access_token,
  );

  if (res.session?.access_token) {
    setToken(res.session.access_token);
    console.log(
      "✅ [login] เก็บ token แล้ว ค่า:",
      localStorage.getItem("zuugroup_token"),
    );
  } else {
    console.log("❌ [login] ไม่มี access_token!");
  }

  if (res.user) {
    setStoredUser(res.user);
    console.log("✅ [login] เก็บ user แล้ว");
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
