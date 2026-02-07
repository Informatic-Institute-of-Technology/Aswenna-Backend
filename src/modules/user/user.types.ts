export interface PersonalInfoI {
  readonly profilePicture: string;
  readonly nicNumber: string;
  readonly birthday: string | Date;
  readonly gender: string;
  readonly age: number;
  readonly province: string;
  readonly city: string;
  readonly district: string;
  readonly postalCode: string;
  readonly address: string;
  readonly nicFrontImage: string;
  readonly nicBackImage: string;
}

export interface FarmerDetailsI {
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly govijanaSevaId: string;
  readonly GovijanaSevaPassbookImage: string;
  readonly gnCertificateImage: string;
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
  readonly investorDetails?: InvestorDetailsI;
}

export interface UserUpdateI {
  readonly fullName: string;
  readonly address: string;
  readonly phoneNumber: string;
}
