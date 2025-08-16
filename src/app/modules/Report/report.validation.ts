import { z } from "zod";

// Create Report schema
const createReportSchema = z.object({
  body: z.object({
    description: z.string({ required_error: "Description is required!" }),
  }),
});

export const ReportsValidation = {
  createReportSchema,
};
