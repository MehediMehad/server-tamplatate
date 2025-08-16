import { z } from "zod";
import {
  InstrumentsConditionEnum,
  InstrumentsCategoriesEnum,
  InstrumentsGenresEnum,
  WorkDaysEnum,
} from "@prisma/client";

const createInstrumentsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image: z.string().url("Image must be a valid URL").optional(),
  description: z.string().min(1, "Description is required"),
  ratePerHour: z.number().positive("Rate must be a positive number"),
  condition: z.nativeEnum(InstrumentsConditionEnum),
  categories: z
    .array(z.nativeEnum(InstrumentsCategoriesEnum))
    .min(1, "At least one category is required"),
  genre: z
    .array(z.nativeEnum(InstrumentsGenresEnum))
    .min(1, "At least one genre is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number(),
  longitude: z.number(),
  license: z.string().url("License must be a valid URL").optional(),

  // Contact
  contactName: z.string().min(1, "Contact name is required"),
  contactNumber: z.string().min(5, "Contact number is required"),
  contactEmail: z.string().email("Invalid email address"),
  availability: z
    .array(z.nativeEnum(WorkDaysEnum))
    .min(1, "At least one day is required"),
});

export const InstrumentValidation = {
  createInstrumentsSchema,
};
