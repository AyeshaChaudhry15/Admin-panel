"use client";

import { KeyRound, Lock } from "lucide-react";
import { useState } from "react";
import { useFormSubmit } from "@/components/crud";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, FormAlert } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { changePassword } from "@/lib/actions/auth";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/constants";

export function ChangePasswordButton() {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <KeyRound />
        Change password
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Change password"
        description="You'll stay signed in here. Other devices will be signed out."
        icon={<Lock />}
        tone="violet"
        size="md"
      >
        <ChangePasswordForm
          onCancel={() => setOpen(false)}
          onSuccess={(message) => {
            toast.success(message);
            setOpen(false);
          }}
        />
      </Dialog>
    </>
  );
}

function ChangePasswordForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (message: string) => void;
  onCancel: () => void;
}) {
  const { error, pending, handleSubmit } = useFormSubmit(
    changePassword,
    onSuccess,
  );

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-5">
        <Field label="Current password" htmlFor="current-password">
          <PasswordInput
            id="current-password"
            name="currentPassword"
            autoComplete="current-password"
            required
            data-autofocus
          />
        </Field>
        <Field
          label="New password"
          htmlFor="new-password"
          hint={`${PASSWORD_MIN}–${PASSWORD_MAX} characters, different from your current password.`}
        >
          <PasswordInput
            id="new-password"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password">
          <PasswordInput
            id="confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
          />
        </Field>
        {error && <FormAlert>{error}</FormAlert>}
      </DialogBody>

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" pending={pending}>
          Update password
        </Button>
      </DialogFooter>
    </form>
  );
}
