import { Gender } from './schemas/user.schema';

export interface PersonalInfoI {
  readonly nicNumber: string;
  readonly gender: Gender;
  readonly birthday: string;
  readonly age: number;
  readonly address: string;
  readonly postalCode: string;
  readonly city: string;
  readonly province: string;
  readonly district: string;
}

export interface FarmerDetailsI {
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly govijanaSevaId: string;
  readonly crop: string;
  readonly experience: string;
  readonly regions: string;
  readonly specificNeeds: string;
}

export interface InvestorDetailsI {
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly organizationName: string;
  readonly companyAddress: string;
  readonly organizationPhoneNumber: string;
  readonly registrationNo: string;
  readonly cropFocus: string;
}

export interface LandOwnerLocationI {
  readonly latitude: number;
  readonly longitude: number;
}

export interface LandAddressI {
  readonly street: string;
  readonly city: string;
  readonly province: string;
  readonly district: string;
  readonly postalCode: string;
  readonly size: string;
  readonly soilType: string;
  readonly rentalExpectation: string;
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly landImages: string[];
}

export interface LandOwnerDetailsI {
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly location: LandOwnerLocationI;
  readonly landAddress: LandAddressI;
}

export interface UserCreateI {
  readonly fullName: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly phoneNumber: string;
  readonly phoneNumberVerified: boolean;
  readonly password: string;
  readonly personalInfo: PersonalInfoI;
  readonly role: string;
  readonly farmerDetails?: FarmerDetailsI;
  // readonly investorDetails?: InvestorDetailsI;
  // readonly landOwnerDetails?: LandOwnerDetailsI;
}

export interface UserUpdateI {
  readonly fullName: string;
  readonly address: string;
  readonly phoneNumber: string;
  readonly status: string;
}
