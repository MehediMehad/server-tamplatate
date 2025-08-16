import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserServices } from "./user.service";
import { Request, Response } from "express";

const createUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.createUsers(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Account created! Check your email for OTP.",
    data: result,
  });
});

const socialLogin = catchAsync(async (req, res) => {
  const result = await UserServices.socialLogin(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Login successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const result = await UserServices.getMyProfile(role, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User Info fetched successfully!",
    data: result,
  });
});

const updateUserInfo = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const result = await UserServices.updateUserInfo(role, userId, req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Update User Info successfully!",
    data: result,
  });
});

const updateUserRoleStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserServices.updateUserRoleStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.user,
  });
});

export const UserControllers = {
  createUsers,
  socialLogin,
  getMyProfile,
  updateUserInfo,
  updateUserRoleStatus,
};
