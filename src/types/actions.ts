export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export interface AuthFormState {
  error?: string;
  email?: string;
  otp?: string;
}
