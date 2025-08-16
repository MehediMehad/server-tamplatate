import express from "express";
import auth from "../../middlewares/auth";
import { VocalistControllers } from "./vocalist.controller";

const router = express.Router();

// GET REQUEST
router.get(
  "/all-vocalists",
  auth("MUSICIAN", "USER", "VOCALIST"),
  VocalistControllers.AllVocalists
);

router.get(
  "/single-vocalist-details/:vocalistId",
  auth("MUSICIAN", "USER", "VOCALIST"),
  VocalistControllers.getSingleVocalistById
);

export const VocalistRouters = router;
