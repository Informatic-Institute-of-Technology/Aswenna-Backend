export interface UserCreateI {
  readonly fullName: string;
  readonly address: string;
  readonly nicNumber: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber: string;
  readonly role: string;
}

export interface UserUpdateI {
  readonly fullName: string;
  readonly address: string;
  readonly phoneNumber: string;
}
