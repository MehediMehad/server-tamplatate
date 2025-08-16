import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { BookingServices } from "./booking.service";

const createBookingAndHoldFunds = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const payload = req.body;

    const result = await BookingServices.createBookingAndHoldFunds(
      userId,
      payload
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Booking Successfully!",
      data: result,
    });
  }
);

const releaseFundsToProvider = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const paymentId = req.params.paymentId;

    const result = await BookingServices.releaseFundsToProvider(
      paymentId,
      userId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Funds released successfully",
      data: result,
    });
  }
);

const getPaymentDetailsWithBookings = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    const result = await BookingServices.getPaymentDetailsWithBookings(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment details retrieved successfully",
      data: result,
    });
  }
);

// Get My Task
const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await BookingServices.getMyTasks(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My Tasks retrieved successfully",
    data: result,
  });
});

// Requested For Payment
const requestedForPayment = catchAsync(async (req: Request, res: Response) => {
  const paymentId = req.params.paymentId;
  const userId = req.user.id;

  const result = await BookingServices.requestedForPayment(paymentId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your Request Send successfully !",
    data: result,
  });
});

const requestRefund = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const paymentId = req.params.paymentId;
  const { reason } = req.body;

  const result = await BookingServices.requestRefund(userId, paymentId, reason);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Refund requested successfully`,
    data: result,
  });
});

const getPendingRefundRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BookingServices.getPendingRefundRequests();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Pending Refund Requested Retrieved successfully`,
      data: result,
    });
  }
);

const rejectRefund = catchAsync(async (req: Request, res: Response) => {
  const refundRequestId = req.params.refundRequestId;
  const result = await BookingServices.rejectRefund(refundRequestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Reject Refund Request successfully`,
    data: result,
  });
});

const approveRefund = catchAsync(async (req: Request, res: Response) => {
  const refundRequestId = req.params.refundRequestId;
  const result = await BookingServices.approveRefund(refundRequestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Approve Refund Request successfully`,
    data: result,
  });
});

export const BookingControllers = {
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
