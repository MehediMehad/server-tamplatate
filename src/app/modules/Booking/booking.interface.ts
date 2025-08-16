import { BookingStatus } from "@prisma/client";

export interface BookingPayload {
  musicianId?: string | null;
  vocalistId?: string | null;
  instrumentId?: string | null;

  currency: string;
  paymentMethodId: string;

  bookings: {
    bookDate: string; // ISO date string, e.g. "2025-08-20"
    startTime: string; // ISO datetime string, e.g. "2025-08-20T14:00:00.000Z"
    endTime: string; // ISO datetime string, e.g. "2025-08-20T16:00:00.000Z"
  }[];

  status?: BookingStatus; // Defaults to PENDING if not provided
}
