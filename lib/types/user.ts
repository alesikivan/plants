export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  preferredLanguage?: string;
}
