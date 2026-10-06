/** What every mutation Server Action resolves to. */
export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** State shape for the auth forms driven by `useActionState`. */
export interface AuthFormState {
  error?: string;
  /** Echoed back so these fields keep their values after a failed submit. */
  email?: string;
  otp?: string;
}
