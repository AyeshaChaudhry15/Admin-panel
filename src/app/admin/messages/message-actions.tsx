"use client";

import {
  ChevronDown,
  Eye,
  Mail,
  MessageSquare,
  Reply,
  Trash2,
} from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { toneBadge, toneText } from "@/components/ui/tone";
import {
  deleteContactSubmission,
  updateContactStatus,
} from "@/lib/actions/requests";
import { CONTACT_STATUS_TONE, CONTACT_STATUSES } from "@/lib/constants";
import { capitalize, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ContactStatus, ContactSubmission } from "@/types/api";

function replyHref(message: ContactSubmission) {
  const subject = encodeURIComponent(`Re: ${message.reason} — EVINN`);
  return `mailto:${message.email}?subject=${subject}`;
}

export function MessageStatusSelect({
  message,
}: {
  message: ContactSubmission;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [status, setOptimisticStatus] = useOptimistic(message.status);

  function change(next: ContactStatus) {
    startTransition(async () => {
      setOptimisticStatus(next);
      const result = await updateContactStatus(message._id, next);

      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  return (
    <div className="relative inline-block">
      <select
        aria-label={`Status of message from ${message.fullName}`}
        value={status}
        onChange={(event) => change(event.target.value as ContactStatus)}
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-full border py-0 pr-7 pl-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#0057D9]/50 [&>option]:bg-[#0a141e] [&>option]:text-white",
          "border-[#1d2b38] bg-[#0a141e] text-white",
        )}
      >
        {CONTACT_STATUSES.map((value) => (
          <option key={value} value={value}>
            {capitalize(value)}
          </option>
        ))}
      </select>

      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-[#FF8A00]"
      />
    </div>
  );
}

export function MessageActions({ message }: { message: ContactSubmission }) {
  const [dialog, setDialog] = useState<"view" | "delete" | null>(null);

  const close = () => setDialog(null);

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setDialog("view")}
        aria-label={`Read message from ${message.fullName}`}
        title="Read"
        className="flex size-9 items-center justify-center rounded-lg border border-[#1d2b38] bg-[#0a141e] text-[#0057D9] transition-colors hover:border-[#0057D9] hover:bg-[#0057D9]/10 hover:text-[#1677FF]"
      >
        <Eye className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => setDialog("delete")}
        aria-label={`Delete message from ${message.fullName}`}
        title="Delete"
        className="flex size-9 items-center justify-center rounded-lg border border-[#FF8A00]/20 bg-[#FF8A00]/5 text-[#FF8A00] transition-colors hover:border-[#FF8A00] hover:bg-[#FF8A00]/10 hover:text-[#ff9d2e]"
      >
        <Trash2 className="size-4" />
      </button>

      <Dialog
        open={dialog === "view"}
        onClose={close}
        title={message.fullName}
        description={`${message.reason} · ${formatDateTime(message.createdAt)}`}
        icon={<MessageSquare />}
        tone="info"
        size="lg"
      >
        <DialogBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${message.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#0057D9] transition-colors hover:text-[#1677FF]"
            >
              <Mail className="size-4" />
              {message.email}
            </a>

            <Badge tone={CONTACT_STATUS_TONE[message.status]} dot>
              {capitalize(message.status)}
            </Badge>
          </div>

          <div className="rounded-xl border border-[#1d2b38] bg-[#0a141e] p-4 text-sm leading-relaxed whitespace-pre-wrap text-[#d7e0ea]">
            {message.message || (
              <span className="text-[#7f8c9a] italic">
                No message was included.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#8f9baa]">
              Replies go out from your email app. Mark the message as answered
              afterwards.
            </p>

            <MessageStatusSelect message={message} />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="danger-soft"
            onClick={() => setDialog("delete")}
            className="sm:mr-auto"
          >
            <Trash2 />
            Delete
          </Button>

          <Button variant="secondary" onClick={close}>
            Close
          </Button>

          <a
            href={replyHref(message)}
            className={cn(
              buttonStyles(),
              "border border-[#FF8A00] bg-[#FF8A00] text-white transition-colors hover:bg-[#e67b00]",
            )}
          >
            <Reply />
            Reply by email
          </a>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={dialog === "delete"}
        onClose={close}
        title="Delete message?"
        confirmLabel="Delete message"
        description={
          <>
            The message from{" "}
            <b className="text-white">{message.fullName}</b>{" "}
            will be permanently deleted.
          </>
        }
        onConfirm={() => deleteContactSubmission(message._id)}
      />
    </div>
  );
}