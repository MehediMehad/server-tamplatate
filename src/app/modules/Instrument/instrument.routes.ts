import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../middlewares/fileUploader";
import { InstrumentControllers } from "./instrument.controller";
import { InstrumentValidation } from "./instrument.validation";

const router = express.Router();

// POST REQUEST
router.post(
  "/create-instrument",
  auth("USER", "MUSICIAN", "VOCALIST"),
  fileUploader.uploadFields,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.data !== "object") {
        req.body.data = JSON.parse(req.body.data);
      }

      const parsedData = InstrumentValidation.createInstrumentsSchema.parse(
        req.body.data
      );

      req.body = parsedData;

      InstrumentControllers.createInstruments(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// GET REQUEST
router.get(
  "/all-instruments",
  auth("MUSICIAN", "USER", "VOCALIST"),
  InstrumentControllers.AllInstruments
);

router.get(
  "/home-instruments",
  auth("MUSICIAN", "USER", "VOCALIST"),
  InstrumentControllers.getInstrumentsForHome
);

router.get(
  "/single-instrument-details/:instrumentId",
  auth("MUSICIAN", "USER", "VOCALIST"),
  InstrumentControllers.getSingleInstrumentById
);

export const InstrumentRouters = router;
