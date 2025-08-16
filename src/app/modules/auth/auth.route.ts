import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { AuthControllers } from "./auth.controller";
import { authValidation } from "./auth.validation";
const router = express.Router();

router.post(
  "/login",
  validateRequest(authValidation.loginUserSchema),
  AuthControllers.loginUser
);
router.post(
  "/forgot-password",
  validateRequest(authValidation.forgotPassword),
  AuthControllers.forgotPassword
);

router.post(
  "/reset-password",
  auth("MUSICIAN", "USER", "VOCALIST"),
  validateRequest(authValidation.passwordResetSchema),
  AuthControllers.resetPassword
);

router.post(
  "/verify-otp",
  validateRequest(authValidation.verifyOtpSchema),
  AuthControllers.verifiedEmail
);

router.post("/resend-otp", AuthControllers.resendOTP);

router.post(
  "/change-password",
  validateRequest(authValidation.changePasswordValidationSchema),
  auth("MUSICIAN", "USER", "VOCALIST"),
  AuthControllers.changePassword
);
router.post(
  "/set-new-password",
  validateRequest(authValidation.setNewPasswordValidationSchema),
  auth("MUSICIAN", "USER", "VOCALIST"),
  AuthControllers.setNewPassword
);

export const AuthRouters = router;
