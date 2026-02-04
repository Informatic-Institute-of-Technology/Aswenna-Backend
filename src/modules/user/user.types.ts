export interface PersonalInfoI {
  readonly profilePicture: string;
  readonly nicNumber: string;
  readonly birthday: string | Date;
  readonly gender: string;
  readonly age: number;
  readonly province: string;
  readonly district: string;
  readonly postalCode: string;
  readonly address: string;
}

export interface FarmerDetailsI {
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly crop: string;
  readonly experience: string;
  readonly regions: string;
  readonly specificNeeds: string;
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
  readonly farmerDetails: FarmerDetailsI;
}

export interface UserUpdateI {
  readonly fullName: string;
  readonly address: string;
  readonly phoneNumber: string;
}
