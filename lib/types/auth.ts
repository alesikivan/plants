import { UserResponse } from './user';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  preferredLanguage?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user?: UserResponse;
  requiresVerification?: boolean;
}
