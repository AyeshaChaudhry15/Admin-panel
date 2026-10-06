/** Items waiting for the admin; `null` when the count couldn't be loaded. */
export interface PendingCounts {
  orders: number | null;
  testRides: number | null;
  messages: number | null;
}
