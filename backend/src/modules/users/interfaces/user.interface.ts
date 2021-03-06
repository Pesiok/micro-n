export interface User {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly description?: string;
  readonly isActive?: boolean;
}