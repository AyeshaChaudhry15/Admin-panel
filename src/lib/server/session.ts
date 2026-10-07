import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOGIN_PATH, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants";
import { api, ApiError } from "@/lib/server/http";
import type { Admin, MeResponse } from "@/types/api";

async function setSessionCookie(token: string, maxAge: number) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function storeSessionFrom(
  response: Response,
  fallbackToken?: string,
) {
  const header = response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));

  if (!header) {
    if (fallbackToken) await setSessionCookie(fallbackToken, SESSION_MAX_AGE);
    return;
  }

  const [pair, ...attributes] = header.split(";").map((part) => part.trim());
  const token = decodeURIComponent(pair.slice(SESSION_COOKIE.length + 1));
  const maxAgeAttribute = attributes.find((part) => /^max-age=/i.test(part));
  const maxAge = maxAgeAttribute
    ? Number(maxAgeAttribute.split("=")[1])
    : SESSION_MAX_AGE;

  if (!token || !(maxAge > 0)) {
    await clearSession();
    return;
  }

  await setSessionCookie(token, maxAge);
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
  if (!(await cookies()).has(SESSION_COOKIE)) return null;

  try {
    const { admin } = await api<MeResponse>("/admin/auth/me", {
      onUnauthorized: "throw",
    });
    return admin;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export const requireAdmin = cache(async (): Promise<Admin> => {
  const admin = await getCurrentAdmin();

  if (!admin) {
    const hadSession = (await cookies()).has(SESSION_COOKIE);
    redirect(hadSession ? `${LOGIN_PATH}?session=expired` : LOGIN_PATH);
  }

  return admin;
});
