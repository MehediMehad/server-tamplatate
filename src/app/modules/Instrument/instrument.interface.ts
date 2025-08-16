import {
  InstrumentsCategoriesEnum,
  InstrumentsConditionEnum,
  InstrumentsGenresEnum,
  WorkDaysEnum,
} from "@prisma/client";

export interface CreateInstrumentPayload {
  title: string;
  image?: string;
  description: string;
  ratePerHour: number;
  condition: InstrumentsConditionEnum;
  categories: InstrumentsCategoriesEnum[];
  genre: InstrumentsGenresEnum[];
  address: string;
  latitude: number;
  longitude: number;
  license?: string;

  contactName: string;
  contactNumber: string;
  contactEmail: string;
  availability: WorkDaysEnum[];
}

export interface InstrumentQueryOptions {
  searchTerm?: string;
  categories?: string;
  availability?: string;
  condition?: string;
  genre?: string;
  priceRange?: string;
  minimumRating?: string;
  distance?: string;
}
