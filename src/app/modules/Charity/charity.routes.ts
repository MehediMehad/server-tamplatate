import express, { Request, Response, NextFunction } from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../middlewares/fileUploader";
import { CharityControllers } from "./charity.controller";
import { CharityValidation } from "./charity.validation";

const router = express.Router();

// POST REQUEST
router.post(
  "/create-charity",
  auth("USER", "MUSICIAN", "VOCALIST"),
  fileUploader.uploadFields,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.data !== "object") {
        req.body.data = JSON.parse(req.body.data);
      }

      const parsedData = CharityValidation.createCharitySchema.parse(
        req.body.data
      );

      req.body = parsedData;
      CharityControllers.createCharity(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// GET REQUEST
router.get(
  "/all-charity",
  auth("MUSICIAN", "USER", "VOCALIST"),
  CharityControllers.AllCharity
);

export const CharityRouters = router;
