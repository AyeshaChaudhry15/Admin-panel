"use server";

import { redirect } from "next/navigation";
import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from "@/lib/constants";
import { readText } from "@/lib/server/action-utils";
import { api, ApiError, apiRequest } from "@/lib/server/http";
import { clearSession, storeSessionFrom } from "@/lib/server/session";
import { safeRedirectPath } from "@/lib/utils";
import type { ActionResult, AuthFormState } from "@/types/actions";
import type { LoginResponse, MessageResponse } from "@/types/api";

function readPassword(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function checkNewPassword(newPassword: string, confirmPassword: string) {
  if (newPassword.length < PASSWORD_MIN) {
    return `New password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (newPassword.length > PASSWORD_MAX) {
    return `New password must be at most ${PASSWORD_MAX} characters.`;
  }
  if (newPassword !== confirmPassword) return "The new passwords don't match.";
  return null;
}

function friendlyError(error: ApiError) {
  return error.status === 429
    ? "Too many attempts. Please wait a few minutes and try again."
    : error.message;
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readText(formData, "email");
  const password = readPassword(formData, "password");

  if (!email || !password)
    return { error: "Email and password are required.", email };

  try {
    const { data, response } = await apiRequest<LoginResponse>(
      "/admin/auth/login",
      {
        method: "POST",
        body: { email, password },
        onUnauthorized: "throw",
      },
    );
    await storeSessionFrom(response, data.accessToken);
  } catch (error) {
    if (error instanceof ApiError)
      return { error: friendlyError(error), email };
    throw error;
  }

  redirect(safeRedirectPath(formData.get("next")) ?? DASHBOARD_PATH);
}

export async function logout() {
  try {
    await api("/admin/auth/logout", {
      method: "POST",
      onUnauthorized: "throw",
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }

  await clearSession();
  redirect(LOGIN_PATH);
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readText(formData, "email");
  if (!email) return { error: "Enter your admin email address.", email };

  try {
    await api<MessageResponse>("/admin/auth/forgot-password", {
      method: "POST",
      body: { email },
      onUnauthorized: "throw",
    });
  } catch (error) {
    if (error instanceof ApiError)
      return { error: friendlyError(error), email };
    throw error;
  }

  redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

export async function resendResetCode(email: string): Promise<ActionResult> {
  const address = typeof email === "string" ? email.trim() : "";
  if (!address)
    return { ok: false, error: "Email address is missing. Start again." };

  try {
    const { message } = await api<MessageResponse>(
      "/admin/auth/forgot-password",
      {
        method: "POST",
        body: { email: address },
        onUnauthorized: "throw",
      },
    );
    return { ok: true, message };
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: friendlyError(error) };
    throw error;
  }
}

export async function resetPassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readText(formData, "email");
  const otp = readText(formData, "otp");
  const newPassword = readPassword(formData, "newPassword");

  if (!/^\d{6}$/.test(otp))
    return { error: "Enter the 6-digit code from the email.", email, otp };

  const passwordError = checkNewPassword(
    newPassword,
    readPassword(formData, "confirmPassword"),
  );
  if (passwordError) return { error: passwordError, email, otp };

  try {
    await api<MessageResponse>("/admin/auth/reset-password", {
      method: "POST",
      body: { otp, newPassword },
      onUnauthorized: "throw",
    });
  } catch (error) {
    if (error instanceof ApiError)
      return { error: friendlyError(error), email, otp };
    throw error;
  }

  await clearSession();
  redirect(`${LOGIN_PATH}?reset=1`);
}

export async function changePassword(
  formData: FormData,
): Promise<ActionResult> {
  const currentPassword = readPassword(formData, "currentPassword");
  const newPassword = readPassword(formData, "newPassword");

  if (!currentPassword)
    return { ok: false, error: "Current password is required." };

  const passwordError = checkNewPassword(
    newPassword,
    readPassword(formData, "confirmPassword"),
  );
  if (passwordError) return { ok: false, error: passwordError };

  if (newPassword === currentPassword) {
    return {
      ok: false,
      error: "New password must be different from the current password.",
    };
  }

  try {
    const { data, response } = await apiRequest<MessageResponse>(
      "/admin/auth/change-password",
      { method: "PATCH", body: { currentPassword, newPassword } },
    );
    await storeSessionFrom(response);
    return { ok: true, message: data.message };
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: friendlyError(error) };
    throw error;
  }
}
