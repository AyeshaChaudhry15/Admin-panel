"use client";

import { TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/types/actions";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  icon?: React.ReactNode;
  variant?: "danger" | "primary";
  onConfirm: () => Promise<ActionResult>;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  icon = <TriangleAlert />,
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await onConfirm();
        if (result.ok) {
          toast.success(result.message);
          close();
        } else {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      icon={icon}
      tone={variant === "danger" ? "danger" : "brand"}
      size="sm"
      busy={pending}
    >
      <DialogBody>
        <div className="space-y-4 text-sm leading-relaxed text-ink-soft">
          <div>{description}</div>
          {error && <FormAlert>{error}</FormAlert>}
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="secondary" onClick={close} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant={variant}
          onClick={confirm}
          pending={pending}
          data-autofocus
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
