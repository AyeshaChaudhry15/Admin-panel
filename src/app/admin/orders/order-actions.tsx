"use client";

import {
  Bike,
  CircleCheck,
  CircleX,
  Eye,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { updateOrderStatus } from "@/lib/actions/requests";
import { FINAL_ORDER_STATUSES, ORDER_STATUS_TONE } from "@/lib/constants";
import { capitalize, formatDateTime, formatPKR, orderRef } from "@/lib/format";
import { whatsAppUrl } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/api";

const STATUS_HELP: Record<OrderStatus, string> = {
  pending: "New order. Call the customer to confirm it.",
  processing: "Confirmed with the customer and being prepared or shipped.",
  delivered: "Handed over. Mark it completed once the cash is collected.",
  completed: "Cash collected. This order is closed.",
  cancelled: "Cancelled by the customer or the shop. This order is closed.",
  rejected: "Declined by the shop. This order is closed.",
};

const TRANSITIONS: Record<
  OrderStatus,
  { label: string; icon: LucideIcon; variant: "primary" | "danger-soft"; confirm?: string }
> = {
  pending: { label: "Back to pending", icon: ShoppingBag, variant: "primary" },
  processing: { label: "Confirm order", icon: PackageCheck, variant: "primary" },
  delivered: { label: "Mark delivered", icon: Truck, variant: "primary" },
  completed: {
    label: "Mark completed",
    icon: CircleCheck,
    variant: "primary",
    confirm: "Mark this order as completed? Only do this once the cash has been collected.",
  },
  cancelled: {
    label: "Cancel order",
    icon: CircleX,
    variant: "danger-soft",
    confirm: "Cancel this order? A cancelled order can't be reopened.",
  },
  rejected: {
    label: "Reject order",
    icon: CircleX,
    variant: "danger-soft",
    confirm: "Reject this order? A rejected order can't be reopened.",
  },
};

export function OrderActions({ order }: { order: Order }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [inFlight, setInFlight] = useState<OrderStatus | null>(null);
  const { shippingAddress: address } = order;
  const closed = order.nextStatuses.length === 0;
  const nextStatuses = order.nextStatuses.toSorted(
    (a, b) =>
      Number(TRANSITIONS[a].variant === "primary") - Number(TRANSITIONS[b].variant === "primary"),
  );

  function close() {
    setOpen(false);
    setConfirming(null);
    setError(null);
  }

  function move(status: OrderStatus) {
    if (FINAL_ORDER_STATUSES.includes(status) && confirming !== status) {
      setConfirming(status);
      return;
    }

    setError(null);
    setInFlight(status);
    startTransition(async () => {
      try {
        const result = await updateOrderStatus(order._id, status);
        if (result.ok) {
          toast.success(result.message);
          close();
        } else {
          setError(result.error);
          setConfirming(null);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Eye />
        {closed ? "View" : "Manage"}
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title={`Order ${orderRef(order._id)}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        icon={<ShoppingBag />}
        size="lg"
        busy={pending}
      >
        <DialogBody className="space-y-6">
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-field p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                {capitalize(order.status)}
              </Badge>
              <p className="text-sm text-muted">{STATUS_HELP[order.status]}</p>
            </div>
          </div>

          <section>
            <h3 className="mb-3 text-xs font-bold tracking-[0.12em] text-muted uppercase">Item</h3>
            <div className="flex items-center gap-4 rounded-xl border border-line p-4">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line-strong bg-field">
                {order.bike?.imageUrl ? (
                  <Image src={order.bike.imageUrl} alt="" fill sizes="64px" className="object-contain p-1" />
                ) : (
                  <Bike className="size-6 text-subtle" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{order.bikeName}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {order.quantity} × {formatPKR(order.unitPrice)}
                  {!order.bike && " · no longer in the catalog"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Total</p>
                <p className="text-lg font-bold text-white tabular-nums">{formatPKR(order.totalAmount)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-subtle">Payment: cash on delivery</p>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold tracking-[0.12em] text-muted uppercase">
              Customer
            </h3>
            <div className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-white">{address.fullName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={`tel:${address.phoneNumber}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-field px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-info hover:text-info"
                  >
                    <Phone className="size-3.5" />
                    {address.phoneNumber}
                  </a>
                  {address.phoneNumber.startsWith("+") && (
                    <a
                      href={whatsAppUrl(address.phoneNumber)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
                    >
                      <MessageCircle className="size-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 text-sm text-ink-soft">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                <p className="whitespace-pre-line">
                  {address.address}
                  {"\n"}
                  {address.city} {address.postalCode}
                </p>
              </div>
            </div>
          </section>

          {error && <FormAlert>{error}</FormAlert>}
        </DialogBody>

        <DialogFooter>
          {closed ? (
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
          ) : confirming ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">{TRANSITIONS[confirming].confirm}</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => setConfirming(null)} disabled={pending}>
                  Go back
                </Button>
                <Button
                  variant={TRANSITIONS[confirming].variant === "primary" ? "primary" : "danger"}
                  onClick={() => move(confirming)}
                  pending={pending}
                  autoFocus
                >
                  Yes, {TRANSITIONS[confirming].label.toLowerCase()}
                </Button>
              </div>
            </div>
          ) : (
            nextStatuses.map((status) => {
              const { label, icon: Icon, variant } = TRANSITIONS[status];
              return (
                <Button
                  key={status}
                  variant={variant}
                  onClick={() => move(status)}
                  disabled={pending}
                  pending={pending && inFlight === status}
                >
                  {!(pending && inFlight === status) && <Icon />}
                  {label}
                </Button>
              );
            })
          )}
        </DialogFooter>
      </Dialog>
    </>
  );
}
