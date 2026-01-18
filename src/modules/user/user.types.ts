export interface UserCreateI {
  readonly firstName: string;
  readonly lastName: string;
  readonly address: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber: string;
}

export interface UserUpdateI {
  readonly firstName: string;
  readonly lastName: string;
  readonly address: string;
  readonly phoneNumber: string;
}

export interface IUserFilter {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}
