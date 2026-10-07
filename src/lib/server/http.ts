import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/constants";

const API_URL = (
  process.env.API_URL ?? "https://evinn.evermontech.com/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: FormData | object;
  query?: Record<string, QueryValue>;
  onUnauthorized?: "redirect" | "throw";
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
) {
  const { method = "GET", body, query, onUnauthorized = "redirect" } = options;

  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Cookie", `${SESSION_COOKIE}=${token}`);

  const isForm = body instanceof FormData;
  if (body && !isForm) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Please try again in a moment.",
      503,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized === "redirect") {
      redirect(token ? `${LOGIN_PATH}?session=expired` : LOGIN_PATH);
    }

    const message =
      typeof data?.message === "string" && data.message
        ? data.message
        : `Request failed (${response.status})`;

    throw new ApiError(message, response.status);
  }

  return { data: data as T, response };
}

export async function api<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const { data } = await apiRequest<T>(path, options);
  return data;
}
