import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../config/prisma";

const sendReport = async (req: Request) => {
  const userId = req.user.id;
  const { bookingId, description } = req.body;

  // 1. Check if booking exists
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found!");
  }

  // 2. Check if report already submitted
  const existingReport = await prisma.report.findUnique({
    where: {
      userId_bookingId: {
        userId,
        bookingId,
      },
    },
  });

  if (existingReport) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already reported this booking."
    );
  }

  // 3. Create report
  const report = await prisma.report.create({
    data: {
      userId,
      bookingId,
      description,
    },
  });

  return report;
};

const getHostPropertyServiceReport = async (hostId: string) => {
  const host = await prisma.user.findUnique({
    where: {
      id: hostId,
    },
    select: {
      host: {
        select: {
          hostId: true,
        },
      },
    },
  });

  if (!host || !host.host) {
    throw new ApiError(httpStatus.NOT_FOUND, "Host not found");
  }

  // 1. Fetch all properties for the host
  const properties = await prisma.property.findMany({
    where: {
      hostId: host.host.hostId,
    },
  });

  // 2. Fetch all reports for the properties
  const reports = await prisma.report.findMany({
    where: {
      booking: {
        property: {
          hostId: host.host.hostId,
        },
      },
    },
    include: {
      booking: {
        select: {
          property: {
            select: {
              name: true,
              address: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        // include: {
        //   property: {
        //     select: {
        //       name: true,
        //     },
        //   },
        //   user: {
        //     select: {
        //       name: true,
        //     },
        //   },
        // },
      },
    },
  });

  return reports;
};

export const ReportsService = {
  sendReport,
  getHostPropertyServiceReport,
};
