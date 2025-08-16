import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { BookingValidation } from "./booking.validation";
import { BookingControllers } from "./booking.controller";

const router = express.Router();

// POST REQUEST
router.post(
  "/",
  validateRequest(BookingValidation.createBookingSchema),
  auth("MUSICIAN", "USER", "VOCALIST"),
  BookingControllers.createBookingAndHoldFunds
);

router.post(
  "/release-funds/:paymentId",
  auth("MUSICIAN", "USER", "VOCALIST", "SUPERADMIN"),
  BookingControllers.releaseFundsToProvider
);
router.post(
  "/request-refund/:paymentId",
  validateRequest(BookingValidation.requestRefundSchema),
  auth("MUSICIAN", "USER", "VOCALIST"),
  BookingControllers.requestRefund
);

router.post(
  "/:refundRequestId/approve-refund",
  auth("SUPERADMIN"),
  BookingControllers.approveRefund
);

// PATCH REQUEST
router.patch(
  "/:paymentId/request-for-payment",
  auth("MUSICIAN", "SUPERADMIN", "USER", "VOCALIST"),
  BookingControllers.requestedForPayment
);

router.patch(
  "/:refundRequestId/reject-refund",
  auth("SUPERADMIN"),
  BookingControllers.rejectRefund
);

// GET REQUEST
router.get(
  "/payment/details",
  auth("MUSICIAN", "SUPERADMIN", "USER", "VOCALIST"),
  BookingControllers.getPaymentDetailsWithBookings
);
router.get(
  "/get-my-task",
  auth("MUSICIAN", "USER", "VOCALIST"),
  BookingControllers.getMyTasks
);
router.get(
  "/pending/refund-requests",
  auth("SUPERADMIN"),
  BookingControllers.getPendingRefundRequests
);

export const BookingRouters = router;
