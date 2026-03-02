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
  showPlants: boolean;
  showShelves: boolean;
  showPlantHistory: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  preferredLanguage?: string;
  showPlants?: boolean;
  showShelves?: boolean;
  showPlantHistory?: boolean;
}

export interface AdminCreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface AdminUpdateUserDto {
  email?: string;
  name?: string;
  role?: Role;
  isBlocked?: boolean;
}

export interface UserProfileWithStats {
  id: string;
  name: string;
  role: Role;
  preferredLanguage?: string;
  showPlants: boolean;
  showShelves: boolean;
  showPlantHistory: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalPlants: number;
    totalShelves: number;
  };
}
