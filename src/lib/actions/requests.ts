"use server";

import { CONTACT_STATUSES, ORDER_STATUSES } from "@/lib/constants";
import { orderRef } from "@/lib/format";
import { assertId, InputError, runAction } from "@/lib/server/action-utils";
import { api } from "@/lib/server/http";
import type { ActionResult } from "@/types/actions";
import type {
  ContactStatus,
  MessageResponse,
  OrderResponse,
  OrderStatus,
  TestRideRequestResponse,
} from "@/types/api";

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<ActionResult> {
  return runAction(async () => {
    if (!ORDER_STATUSES.includes(status))
      throw new InputError("Unknown order status.");

    const { order } = await api<OrderResponse>(
      `/orders/${assertId(id)}/status`,
      {
        method: "PATCH",
        body: { status },
      },
    );

    return `Order ${orderRef(order._id)} is now ${order.status}.`;
  });
}

export async function acceptTestRide(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const { testRideRequest } = await api<TestRideRequestResponse>(
      `/test-ride-requests/${assertId(id)}/accept`,
      { method: "PATCH" },
    );

    return `Test ride for ${testRideRequest.requesterName} was accepted.`;
  });
}

export async function rejectTestRide(
  id: string,
  reason: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const rejectionReason = typeof reason === "string" ? reason.trim() : "";
    if (!rejectionReason)
      throw new InputError("Please give a reason for rejecting this request.");
    if (rejectionReason.length > 1000) {
      throw new InputError("The reason can be at most 1000 characters.");
    }

    const { testRideRequest } = await api<TestRideRequestResponse>(
      `/test-ride-requests/${assertId(id)}/reject`,
      { method: "PATCH", body: { rejectionReason } },
    );

    return `Test ride for ${testRideRequest.requesterName} was rejected.`;
  });
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
): Promise<ActionResult> {
  return runAction(async () => {
    if (!CONTACT_STATUSES.includes(status))
      throw new InputError("Unknown message status.");

    await api(`/contact-submissions/${assertId(id)}/status`, {
      method: "PATCH",
      body: { status },
    });

    return `Message marked as ${status}.`;
  });
}

export async function deleteContactSubmission(
  id: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const { message } = await api<MessageResponse>(
      `/contact-submissions/${assertId(id)}`,
      {
        method: "DELETE",
      },
    );
    return message;
  });
}
