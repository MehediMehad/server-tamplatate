import prisma from "../../config/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { stripe } from "../../lib/stripe";
import { createStripeCustomerAcc } from "../../helpers/createStripeCustomerAcc";
import { Prisma } from "@prisma/client";
import { diffHours } from "./booking.utils";
import { BookingPayload } from "./booking.interface";

const createBookingAndHoldFunds = async (
  userId: string,
  payload: BookingPayload
) => {
  const findUser = await prisma.user.findFirstOrThrow({
    where: { id: userId },
  });

  // Ensure Stripe customer
  if (!findUser.customerId) {
    await createStripeCustomerAcc(findUser);
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const customerId = user?.customerId;
  if (!customerId)
    throw new ApiError(
      httpStatus.EXPECTATION_FAILED,
      "Stripe customer not set"
    );

  // figure provider (musician/vocalist/instrument → owner userId)
  // get provider user ID & hourly rate
  const getProviderInfo = async (tx: Prisma.TransactionClient) => {
    if (payload.musicianId) {
      const m = await tx.musician.findUniqueOrThrow({
        where: { id: payload.musicianId },
        select: {
          userId: true,
          ratePerHour: true,
          booking: true,
          workDays: true,
        },
      });
      return {
        providerId: m.userId,
        hourlyRate: m.ratePerHour,
        bookings: m.booking,
        avelevelDays: m.workDays,
      };
    }
    if (payload.vocalistId) {
      const v = await tx.vocalists.findUniqueOrThrow({
        where: { id: payload.vocalistId },
        select: {
          userId: true,
          ratePerHour: true,
          booking: true,
          workDays: true,
        },
      });
      return {
        providerId: v.userId,
        hourlyRate: v.ratePerHour,
        bookings: v.booking,
        avelevelDays: v.workDays,
      };
    }
    if (payload.instrumentId) {
      const i = await tx.instrument.findUniqueOrThrow({
        where: { id: payload.instrumentId },
        select: {
          creatorId: true,
          ratePerHour: true,
          booking: true,
          availability: true,
        },
      });
      return {
        providerId: i.creatorId,
        hourlyRate: i.ratePerHour,
        bookings: i.booking,
        avelevelDays: i.availability,
      };
    }
    throw new ApiError(httpStatus.BAD_REQUEST, "No provider selected");
  };

  return await prisma.$transaction(async (tx) => {
    // 1) total compute
    const { providerId, hourlyRate, bookings, avelevelDays } =
      await getProviderInfo(tx);
    console.log(providerId);

    // 0) Validate day availability + overlap
    for (const b of payload.bookings) {
      // Day check
      const bookingDayName = new Date(b.bookDate)
        .toLocaleDateString("en-US", { weekday: "long" }) // "Monday"
        .toUpperCase(); // → "MONDAY"

      console.log(avelevelDays, hourlyRate);

      if (!avelevelDays.includes(bookingDayName as any)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Provider is not available on ${bookingDayName}`
        );
      }
      // Overlap check
      const overlap = await tx.booking.findFirst({
        where: {
          ...(payload.musicianId
            ? { musicianId: payload.musicianId }
            : payload.vocalistId
            ? { vocalistId: payload.vocalistId }
            : { instrumentId: payload.instrumentId }),

          startTime: { lt: new Date(b.endTime) },
          endTime: { gt: new Date(b.startTime) },
        },
      });

      if (overlap) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `Time slot already booked for ${b.bookDate} (${b.startTime} - ${b.endTime})`
        );
      }
    }

    if (!hourlyRate || hourlyRate <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "hourlyRate is required and must be > 0"
      );
    }

    const totalAmount = payload.bookings.reduce((sum: number, b: any) => {
      const hours = diffHours(b.startTime, b.endTime);
      if (hours <= 0)
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "endTime must be after startTime"
        );
      return sum + hours * hourlyRate;
    }, 0);

    const currency = (payload.currency || "USD").toLowerCase();
    const platformShare = Number((totalAmount * 0.1).toFixed(2));
    const providerShare = Number((totalAmount - platformShare).toFixed(2));

    // 3) Create & confirm PaymentIntent — hold in platform balance
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency,
      customer: customerId,
      payment_method: payload.paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // no-redirect methods only
      },
      // optional: description / metadata
      description: "Booking payment (held by platform until service delivered)",
      metadata: {
        customerId: userId,
        providerId,
        type: "BOOKING_HELD",
      },
    });

    if (pi.status !== "succeeded") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Payment failed with status ${pi.status}`
      );
    }

    // best-effort charge id
    const latestChargeId =
      typeof pi.latest_charge === "string" ? pi.latest_charge : null;

    // 4) Create Payment (HELD) & Bookings (linked)
    const payment = await tx.payment.create({
      data: {
        customerId: userId,
        providerId,
        amount: totalAmount,
        currency: currency.toUpperCase(),
        platformTotalAmount: platformShare,
        providerTotalAmount: providerShare,
        status: "HELD",
        paymentIntentId: pi.id,
        chargeId: latestChargeId || undefined,
        bookingIds: [], // fill after bookings
      },
    });

    const createdBookings = [];
    for (const b of payload.bookings) {
      const booking = await tx.booking.create({
        data: {
          userId,
          paymentId: payment.id,
          musicianId: payload.musicianId || undefined,
          vocalistId: payload.vocalistId || undefined,
          instrumentId: payload.instrumentId || undefined,
          bookDate: new Date(b.bookDate),
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
          status: payload.status || "PENDING",
        },
      });
      createdBookings.push(booking);
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { bookingIds: createdBookings.map((bk) => bk.id) },
    });

    // Create notification for provider
    await tx.notification.create({
      data: {
        receiverId: payment.providerId,
        title: `New Booking Received`,
        body: `You have a new booking request. Please check your dashboard for details.`,
      },
    });

    // Create notification for customer
    await tx.notification.create({
      data: {
        receiverId: payment.customerId,
        title: `Booking Payment Received`,
        body: `Hi ${user.name}, your payment has been successfully made and is held by the platform. The provider will be paid once you accept the service.`,
      },
    });

    return {
      payment: {
        id: payment.id,
        status: "HELD",
        totalAmount,
        platformShare,
        providerShare,
        paymentIntentId: pi.id,
      },
      bookings: createdBookings,
    };
  });
};

const releaseFundsToProvider = async (paymentId: string, userId: string) => {
  const loginUser = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
      isDelete: false,
    },
    select: { id: true, role: true },
  });

  return await prisma.$transaction(async (tx) => {
    // 1) Fetch payment with bookings & provider
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: {
        provider: true,
        bookings: true,
      },
    });

    if (
      loginUser.role !== "SUPERADMIN" &&
      loginUser.id !== payment.customerId
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to release these funds"
      );
    }

    if (payment.status !== "REQUESTED") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot release funds — Payment status is ${payment.status}`
      );
    }

    // 2) Verify all bookings are completed
    const incompleteBookings = payment.bookings.filter(
      (b) => b.status !== "PENDING"
    );
    if (incompleteBookings.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Funds can only be released after all bookings are marked as PENDING"
      );
    }

    // 3) Check provider connected account
    if (!payment.provider.connectAccountId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Provider has no connected Stripe account"
      );
    }

    // 4) Idempotency check — if already transferred, stop
    if (payment.providerTransferId) {
      return {
        ok: true,
        message: "Funds already released",
        paymentId: payment.id,
        transferId: payment.providerTransferId,
      };
    }

    // 5) Perform transfer to provider (90%)
    let transfer;
    try {
      transfer = await stripe.transfers.create({
        amount: Math.round(payment.providerTotalAmount * 100),
        currency: payment.currency.toLowerCase(),
        destination: payment.provider.connectAccountId,
        description: `Payout for bookings: ${payment.bookingIds.join(",")}`,
        metadata: {
          paymentId: payment.id,
          providerId: payment.providerId,
          type: "BOOKING_RELEASE",
        },
      });
    } catch (err) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Stripe transfer failed: " + (err as Error).message
      );
    }

    // 6) Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "RELEASED",
        providerTransferId: transfer.id,
        updatedAt: new Date(),
      },
    });

    // 7) Update booking status
    await tx.booking.updateMany({
      where: { paymentId: payment.id },
      data: {
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });

    // 8) Return success
    return {
      ok: true,
      message: "Funds released successfully",
      paymentId: payment.id,
      transferId: transfer.id,
    };
  });
};

const getPaymentDetailsWithBookings = async (userId: string) => {
  const payment = await prisma.payment.findMany({
    where: {
      customerId: userId,
    },
    include: {
      customer: {
        select: { id: true, name: true, email: true, image: true },
      },
      provider: {
        select: { id: true, name: true, email: true, image: true },
      },
      bookings: {
        select: {
          id: true,
          bookDate: true,
          startTime: true,
          endTime: true,
          status: true,
          musician: {
            select: {
              name: true,
              image: true,
            },
          },
          instrument: {
            select: {
              title: true,
              image: true,
            },
          },
          vocalist: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return payment.map((p) => ({
    paymentId: p.id,
    status: p.status,
    amount: p.amount,
    currency: p.currency,
    customer: p.customer,
    provider: p.provider,
    createdAt: p.createdAt,
    bookings: p.bookings,
  }));
};

// Get My Task
const getMyTasks = async (userId: string) => {
  const payment = await prisma.payment.findMany({
    where: {
      providerId: userId,
    },
    include: {
      customer: {
        select: { id: true, name: true, email: true, image: true },
      },
      provider: {
        select: { id: true, name: true, email: true, image: true },
      },
      bookings: {
        select: {
          id: true,
          bookDate: true,
          startTime: true,
          endTime: true,
          status: true,
          musician: {
            select: {
              name: true,
              image: true,
              ratePerHour: true,
            },
          },
          instrument: {
            select: {
              title: true,
              image: true,
              ratePerHour: true,
            },
          },
          vocalist: {
            select: {
              name: true,
              image: true,
              ratePerHour: true,
            },
          },
        },
      },
    },
  });

  return payment.map((p) => ({
    paymentId: p.id,
    status: p.status,
    providerTotalAmount: p.providerTotalAmount,
    platformTotalAmount: p.platformTotalAmount,
    amount: p.amount,
    customer: p.customer,
    createdAt: p.createdAt,
    bookings: p.bookings,
  }));
};

// Requested For Payment
const requestedForPayment = async (paymentId: string, userId: string) => {
  const loginUser = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
      isDelete: false,
    },
    select: { id: true, role: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    // 1) Fetch payment with bookings & provider
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: {
        provider: true,
      },
    });

    if (
      loginUser.role !== "SUPERADMIN" &&
      loginUser.id !== payment.providerId
    ) {
      console.log(loginUser.id, payment.providerId);

      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to request payment"
      );
    }

    if (payment.status !== "HELD") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot release funds — Payment status is ${payment.status}`
      );
    }

    // 3) Check provider connected account
    if (!payment.provider.connectAccountId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Provider has no connected Stripe account"
      );
    }

    // 4) Idempotency check — if already transferred, stop
    if (payment.providerTransferId) {
      return {
        ok: true,
        message: "Funds already released",
        paymentId: payment.id,
        transferId: payment.providerTransferId,
      };
    }

    // 5) Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "REQUESTED",
        updatedAt: new Date(),
      },
    });

    // 6) Create notification
    await tx.notification.create({
      data: {
        title: `Payment Requested`,
        receiverId: payment.customerId,
        senderId: payment.providerId,
        body: `Provider ${payment.provider.name} has requested payment for your booking. Please review and process the payment.`,
      },
    });

    // 7) Return success
    return {
      paymentId,
      status: payment.status,
    };
  });

  return result;
};

const requestRefund = async (
  userId: string,
  paymentId: string,
  reason: string
) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });

  if (payment.customerId !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only request a refund for your own payment"
    );
  }

  if (payment.status !== "HELD") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Refund can only be requested while payment is HELD"
    );
  }

  return await prisma.refundRequest.create({
    data: {
      paymentId,
      customerId: userId,
      providerId: payment.providerId,
      reason,
      status: "PENDING",
    },
  });
};

const getPendingRefundRequests = async () => {
  return await prisma.refundRequest.findMany({
    where: { status: "PENDING" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      provider: { select: { id: true, name: true, email: true } },
      payment: {
        select: { id: true, amount: true, currency: true, status: true },
      },
    },
  });
};

const rejectRefund = async (refundRequestId: string) => {
  return await prisma.refundRequest.update({
    where: { id: refundRequestId },
    data: { status: "REJECTED" },
  });
};

const approveRefund = async (refundRequestId: string) => {
  return await prisma.$transaction(async (tx) => {
    const refundRequest = await tx.refundRequest.findUniqueOrThrow({
      where: { id: refundRequestId },
      include: { payment: true },
    });

    const payment = refundRequest.payment;

    if (payment.status !== "HELD") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Refund can only be processed for HELD payments"
      );
    }

    // Refund only provider share
    const refundAmount = payment.providerTotalAmount;

    let stripeRefund;
    try {
      stripeRefund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: Math.round(refundAmount * 100), // cents
        metadata: {
          refundRequestId: refundRequest.id,
          reason: refundRequest.reason,
          type: "ADMIN_APPROVED_REFUND",
        },
      });
    } catch (err) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Stripe refund failed: " + (err as Error).message
      );
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        providerTransferReversedId: stripeRefund.id,
      },
    });

    await tx.refundRequest.update({
      where: { id: refundRequest.id },
      data: { status: "REFUNDED" },
    });

    return {
      ok: true,
      paymentId: payment.id,
      refundedAmount: refundAmount,
      stripeRefundId: stripeRefund.id,
    };
  });
};

export const BookingServices = {
  createBookingAndHoldFunds,
  releaseFundsToProvider,
  getPaymentDetailsWithBookings,
  requestRefund,
  getPendingRefundRequests,
  rejectRefund,
  approveRefund,
  getMyTasks,
  requestedForPayment,
};
