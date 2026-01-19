export interface AuthPayloadI {
  readonly sub: string;
  readonly email: string;
  role?: string;
}
