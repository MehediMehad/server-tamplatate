import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { UserValidation } from "./user.validation";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { fileUploader } from "../../middlewares/fileUploader";

const router = express.Router();

router.post(
  "/create-users",
  validateRequest(UserValidation.createUsersSchema),
  UserControllers.createUsers
);

router.put(
  "/update-profile",
  auth("USER", "MUSICIAN", "VOCALIST"),
  fileUploader.uploadFields, // ✅ must be used here
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.data !== "object") {
        req.body.data = JSON.parse(req.body.data);
      }

      const parsedData = UserValidation.userUpdateValidationSchema.parse(
        req.body.data
      );

      req.body = parsedData;

      UserControllers.updateUserInfo(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/social-login",
  // validateRequest(UserValidation.createVendor),
  UserControllers.socialLogin
);

router.put(
  "/update-user-status/:id",
  auth("SUPERADMIN"),
  // validateRequest(UserValidation.updateUserRoleStatusSchema),
  UserControllers.updateUserRoleStatus
);

// GET REQUEST
router.get(
  "/my-profile",
  auth("MUSICIAN", "USER", "VOCALIST"),
  UserControllers.getMyProfile
);

export const UserRouters = router;
