import express from "express";
import auth from "../../middlewares/auth";
import { MusicianControllers } from "./musician.controller";

const router = express.Router();

// GET REQUEST
router.get(
  "/all-musicians",
  auth("MUSICIAN", "USER", "VOCALIST"),
  MusicianControllers.AllMusicians
);

router.get(
  "/home-musicians",
  auth("MUSICIAN", "USER", "VOCALIST"),
  MusicianControllers.getMusiciansForHome
);
router.get(
  "/single-musician-details/:musicianId",
  auth("MUSICIAN", "USER", "VOCALIST"),
  MusicianControllers.getSingleMusicianById
);

export const MusicianRouters = router;
