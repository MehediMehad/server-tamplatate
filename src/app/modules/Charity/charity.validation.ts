import { z } from "zod";
import { CharityCategoriesEnum, CharityDonationTypeEnum } from "@prisma/client";

export const createCharitySchema = z.object({
  name: z.string().min(1, "Charity name is required"),
  image: z.string().url("Image must be a valid URL").optional(),
  about: z.string().min(1, "About is required"),
  congregationSize: z.number().positive("Size must be a positive number"),
  donationType: z.nativeEnum(CharityDonationTypeEnum),
  categories: z.nativeEnum(CharityCategoriesEnum),
  verificationDocument: z
    .string()
    .url("Verification document must be a valid URL")
    .optional(),
  exemptionCertificate: z
    .string()
    .url("Exemption certificate must be a valid URL")
    .optional(),
  registrationCertificate: z
    .string()
    .url("Registration certificate must be a valid URL")
    .optional(),
  address: z.string().min(1, "Address is required"),
  latitude: z.number(),
  longitude: z.number(),
  license: z.string().url("License must be a valid URL").optional(),
  contactName: z.string().min(1, "Contact name is required"),
  roleInOrganization: z.string().min(1, "Role is required"),
  contactNumber: z.string().min(5, "Contact number is required"),
  contactEmail: z.string().email("Invalid email address"),
});

export const CharityValidation = {
  createCharitySchema,
};
