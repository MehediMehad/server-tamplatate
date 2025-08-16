import {
  MusicianTypeEnum,
  PraiseEnum,
  WorshipEnum,
  MusicianSkillsEnum,
  VocalistTypeEnum,
  VocalistSkillsEnum,
  WorkDaysEnum,
  MusicGenreEnum,
} from "@prisma/client";
export interface CreateUsersPayload {
  name: string;
  email: string;
  password: string;
  address: string;
  latitude: number;
  longitude: number;
  role: "VOCALIST" | "MUSICIAN" | "USER";
}

export type UserUpdateInput = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type MusicianUpdateInput = {
  name?: string;
  aboutUs?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  primaryName?: string;
  primaryEmail?: string;
  primaryNumber?: string;
  ratePerHour?: number;
  experience?: number;
  license?: string;
  musicalCertification?: string;
  musicianType?: MusicianTypeEnum;
  praise?: PraiseEnum[];
  worship?: WorshipEnum[];
  musicianSkills?: MusicianSkillsEnum[];
  workDays?: WorkDaysEnum[];
};

export type VocalistUpdateInput = {
  name?: string;
  number?: string;
  video?: string;
  aboutUs?: string;
  primaryName?: string;
  primaryEmail?: string;
  primaryNumber?: string;
  ratePerHour?: number;
  experience?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  license?: string;
  musicalCertification?: string;
  vocalistType?: VocalistTypeEnum;
  vocalistSkills?: VocalistSkillsEnum[];
  workDays?: WorkDaysEnum[];
  musicGenre?: MusicGenreEnum[];
};

export interface SocialLoginRequestBody {
  name: string;
  email: string;
  role: "GUEST" | "HOST" | "VENDOR";
  fcmToken?: string;
  hostId?: string;
  serviceCategory?: string;
}
