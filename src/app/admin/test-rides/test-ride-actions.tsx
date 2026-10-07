"use client";

import { Check, CircleX } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, FormAlert, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { acceptTestRide, rejectTestRide } from "@/lib/actions/requests";
import { formatCalendarDate, formatTime } from "@/lib/format";
import type { TestRideRequest } from "@/types/api";

export function TestRideActions({ request }: { request: TestRideRequest }) {
  const toast = useToast();
  const [dialog, setDialog] = useState<"accept" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const close = () => setDialog(null);
  const slot = `${formatCalendarDate(request.preferredDate)} at ${formatTime(request.preferredTime)}`;
  const bikeName = request.bike?.name ?? "a bike that's no longer listed";

  function reject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await rejectTestRide(request._id, reason);
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
    <div className="flex justify-end gap-2">
      <Button size="sm" onClick={() => setDialog("accept")}>
        <Check />
        Accept
      </Button>
      <Button
        variant="danger-soft"
        size="sm"
        onClick={() => setDialog("reject")}
      >
        <CircleX />
        Reject
      </Button>

      <ConfirmDialog
        open={dialog === "accept"}
        onClose={close}
        variant="primary"
        icon={<Check />}
        title="Accept test ride?"
        confirmLabel="Accept request"
        description={
          <div className="space-y-3">
            <p>
              <b className="text-white">{request.requesterName}</b> wants to
              ride <b className="text-white">{bikeName}</b> in{" "}
              {request.preferredCity} on {slot}.
            </p>
            <p className="text-muted">
              The requester isn&apos;t notified automatically. Contact them on
              WhatsApp or by email to confirm the details.
            </p>
          </div>
        }
        onConfirm={() => acceptTestRide(request._id)}
      />

      <Dialog
        open={dialog === "reject"}
        onClose={close}
        title="Reject test ride?"
        description={`${request.requesterName} · ${bikeName} · ${slot}`}
        icon={<CircleX />}
        tone="danger"
        size="md"
        busy={pending}
      >
        <form onSubmit={reject} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <Field
              label="Reason"
              htmlFor={`reject-${request._id}`}
              hint="Saved with the request for your records. The requester isn't emailed automatically."
            >
              <Textarea
                id={`reject-${request._id}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                maxLength={1000}
                rows={4}
                placeholder="e.g. This bike isn't available for test rides in Lahore yet."
                data-autofocus
              />
            </Field>
            {error && <FormAlert>{error}</FormAlert>}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" pending={pending}>
              Reject request
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
