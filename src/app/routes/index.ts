import express from "express";
import { NotificationsRouters } from "../modules/notifications/notification.routes";
import { UserRouters } from "../modules/User/user.routes";
import { AuthRouters } from "../modules/auth/auth.route";
import { ReviewsRoutes } from "../modules/Review/review.route";
import { FavoriteRoutes } from "../modules/Favorite/favorite.route";
import { ReportRoutes } from "../modules/Report/report.route";
import { InstrumentRouters } from "../modules/Instrument/instrument.routes";
import { CharityRouters } from "../modules/Charity/charity.routes";
import { MusicianRouters } from "../modules/Musician/musician.routes";
import { BookingRouters } from "../modules/Booking/booking.routes";
import { VocalistRouters } from "../modules/Vocalist/vocalist.routes";
import { LogsRoutes } from "../modules/Logs/logs.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/user",
    route: UserRouters,
  },
  {
    path: "/musician",
    route: MusicianRouters,
  },
  {
    path: "/vocalist",
    route: VocalistRouters,
  },
  {
    path: "/charity",
    route: CharityRouters,
  },
  {
    path: "/instrument",
    route: InstrumentRouters,
  },
  {
    path: "/booking",
    route: BookingRouters,
  },
  {
    path: "/review",
    route: ReviewsRoutes,
  },
  {
    path: "/report",
    route: ReportRoutes,
  },
  {
    path: "/favorite",
    route: FavoriteRoutes,
  },
  {
    path: "/notification",
    route: NotificationsRouters,
  },
  {
    path: "/logs",
    route: LogsRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
