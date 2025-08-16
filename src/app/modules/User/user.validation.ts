import {
  MusicGenreEnum as MusicGenreEnumS,
  MusicianSkillsEnum as MusicianSkillsEnumS,
  MusicianTypeEnum as MusicianTypeEnumS,
  PraiseEnum as PraiseEnumS,
  UserRoleEnum,
  VocalistSkillsEnum as VocalistSkillsEnumS,
  VocalistTypeEnum as VocalistTypeEnumS,
  WorkDaysEnum as WorkDaysEnumS,
  WorshipEnum as WorshipEnumS,
} from "@prisma/client";
import { z } from "zod";

export const createUsersSchema = z.object({
  body: z.object({
    role: z.enum(["USER", "MUSICIAN", "VOCALIST"]),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    address: z.string().min(1, "Address is required"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

// Enum values for skills etc. (dummy placeholders; replace with your actual enums)
const MusicianSkillsEnum = z.enum(MusicianSkillsEnumS);
const VocalistSkillsEnum = z.enum(VocalistSkillsEnumS);
const MusicianTypeEnum = z.enum(MusicianTypeEnumS);
const VocalistTypeEnum = z.enum(VocalistTypeEnumS);
const PraiseEnum = z.enum(PraiseEnumS);
const WorshipEnum = z.enum(WorshipEnumS);
const WorkDaysEnum = z.enum(WorkDaysEnumS);
const MusicGenreEnum = z.enum(MusicGenreEnumS);

export const userUpdateValidationSchema = z
  .object({
    role: z.nativeEnum(UserRoleEnum),
    name: z.string().min(1, "Name is required"),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    profileImage: z
      .array(z.string().url("Each image must be a valid URL"))
      .min(1, "At least one image is required")
      .optional(),

    // Common
    aboutUs: z.string().optional(),
    primaryName: z.string().optional(),
    primaryEmail: z.string().email().optional(),
    primaryNumber: z.string().optional(),
    ratePerHour: z.number().optional(),
    experience: z.number().int().optional(),
    license: z
      .array(z.string().url("Each image must be a valid URL"))
      .min(1, "At least one image is required")
      .optional(),
    musicalCertification: z
      .array(z.string().url("Each image must be a valid URL"))
      .min(1, "At least one image is required")
      .optional(),

    // Musician-specific
    musicianType: MusicianTypeEnum.optional(),
    praise: z.array(PraiseEnum).optional(),
    worship: z.array(WorshipEnum).optional(),
    musicianSkills: z.array(MusicianSkillsEnum).optional(),
    workDays: z.array(WorkDaysEnum).optional(),

    // Vocalist-specific
    vocalistType: VocalistTypeEnum.optional(),
    video: z
      .array(z.string().url("Each video must be a valid URL"))
      .min(1, "At least one Video is required")
      .optional(),
    musicGenre: z.array(MusicGenreEnum).optional(),
    vocalistSkills: z.array(VocalistSkillsEnum).optional(),
    number: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "MUSICIAN") {
      if (!data.musicianType) {
        ctx.addIssue({
          path: ["musicianType"],
          code: z.ZodIssueCode.custom,
          message: "musicianType is required for role MUSICIAN",
        });
      }

      if (!data.musicianSkills || data.musicianSkills.length === 0) {
        ctx.addIssue({
          path: ["musicianSkills"],
          code: z.ZodIssueCode.custom,
          message: "musicianSkills is required for role MUSICIAN",
        });
      }
    }

    if (data.role === "VOCALIST") {
      if (!data.vocalistType) {
        ctx.addIssue({
          path: ["vocalistType"],
          code: z.ZodIssueCode.custom,
          message: "vocalistType is required for role VOCALIST",
        });
      }

      if (!data.vocalistSkills || data.vocalistSkills.length === 0) {
        ctx.addIssue({
          path: ["vocalistSkills"],
          code: z.ZodIssueCode.custom,
          message: "vocalistSkills is required for role VOCALIST",
        });
      }
    }
  });

export const UserValidation = {
  createUsersSchema,
  userUpdateValidationSchema,
};
