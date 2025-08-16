import express from "express";
import auth from "../../middlewares/auth";
import { FavoritesController } from "./favorite.controller";

const router = express.Router();

router.post(
  "/add-item",
  auth("MUSICIAN", "USER", "VOCALIST"),
  FavoritesController.addFavorite
);
router.delete(
  "/remove/:itemId",
  auth("MUSICIAN", "USER", "VOCALIST"),
  FavoritesController.removeFavorite
);

export const FavoriteRoutes = router;
