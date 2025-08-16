import httpStatus from "http-status";
import ApiError from "../errors/ApiError";
import { stripe } from "../lib/stripe";
import prisma from "../config/prisma";

export const createStripeCustomerAcc = async (payload: any) => {
  const stripeCustomer = await stripe.customers.create({
    email: payload.email.trim(),
    name: payload.name || undefined,
    phone: payload.phone || undefined,
    metadata: {
      userId: payload.id, // Custom internal user ID
      role: payload.role || "USER", // Add any useful info
    },
  });

  if (!stripeCustomer.id) {
    throw new ApiError(
      httpStatus.EXPECTATION_FAILED,
      "Failed to create a Stripe customer"
    );
  }

  await prisma.user.update({
    where: {
      id: payload.id,
    },
    data: {
      customerId: stripeCustomer.id,
    },
  });

  return;
};
