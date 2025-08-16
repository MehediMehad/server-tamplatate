import { CharityCategoriesEnum, CharityDonationTypeEnum } from "@prisma/client";

export interface CreateCharityPayload {
  name: string;
  about: string;
  congregationSize: number;
  donationType: CharityDonationTypeEnum;
  categories: CharityCategoriesEnum;

  address: string;
  latitude: number;
  longitude: number;

  contactName: string;
  roleInOrganization: string;
  contactNumber: string;
  contactEmail: string;
}

export interface CharityQueryOptions {
  searchTerm?: string;
  categories?: string;
  minimumRating?: string;
  donationType?: string;
  distance?: string;
}
