export interface UserCreateI {
  readonly firstName: string;
  readonly lastName: string;
  readonly address: string;
  readonly nicNumber: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber: string;
  readonly role: string;
}

export interface UserUpdateI {
  readonly firstName: string;
  readonly lastName: string;
  readonly address: string;
  readonly phoneNumber: string;
}
