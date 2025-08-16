import { NextFunction, Request, Response } from "express";
import config from "../config";
import { JwtPayload, Secret } from "jsonwebtoken";
import httpStatus from "http-status";
import { jwtHelpers } from "../helpers/jwtHelpers";
import ApiError from "../errors/ApiError";
import prisma from "../config/prisma";
import { UserStatusEnum, UserRoleEnum } from "@prisma/client";

const auth = (...roles: UserRoleEnum[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.access_secret as Secret
      );

      if (!verifiedUser?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }
      const { id } = verifiedUser;

      const user = await prisma.user.findUnique({
        where: {
          id: id,
        },
      });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
      }

      if (user.status === UserStatusEnum.BLOCKED) {
        throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked!");
      }

      if (user.status === UserStatusEnum.DEACTIVATE) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Your account is not Activate!"
        );
      }

      req.user = verifiedUser as JwtPayload;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const optionalAuth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return next();
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.access_secret as Secret
      );

      if (!verifiedUser?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }
      const { id } = verifiedUser;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
      }

      if (user.status === UserStatusEnum.BLOCKED) {
        throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked!");
      }

      if (user.status === UserStatusEnum.DEACTIVATE) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Your account is not Activate!"
        );
      }

      req.user = verifiedUser as JwtPayload;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
