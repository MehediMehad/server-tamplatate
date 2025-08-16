import { z } from "zod";
import { BookingStatus } from "@prisma/client";

const createBookingSchema = z.object({
  body: z.object({
    musicianId: z.string().optional().nullable(),
    vocalistId: z.string().optional().nullable(),
    instrumentId: z.string().optional().nullable(),

    currency: z
      .string()
      .length(3, "Currency must be a valid 3-letter code")
      .toUpperCase()
      .default("USD"),

    paymentMethodId: z.string().min(1, "Payment method ID is required"),

    bookings: z
      .array(
        z.object({
          bookDate: z.string().min(1, "Book date is required"),
          startTime: z.string().min(1, "Start time is required"),
          endTime: z.string().min(1, "End time is required"),
        })
      )
      .nonempty("At least one booking day is required"),

    status: z.nativeEnum(BookingStatus).default("PENDING"),
  }),
});

const requestRefundSchema = z.object({
  body: z.object({
    reason: z.string().min(1, "Reason for refund is required"),
  }),
});

export const BookingValidation = {
  createBookingSchema,
  requestRefundSchema,
};
