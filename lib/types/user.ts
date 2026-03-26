export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
}

export interface SocialLink {
  type: string;
  value: string;
  isPublic: boolean;
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
  showWishlist: boolean;
  isBlocked: boolean;
  bio?: string;
  avatar?: string;
  socialLinks?: SocialLink[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  name?: string;
  bio?: string;
  preferredLanguage?: string;
  showPlants?: boolean;
  showShelves?: boolean;
  showPlantHistory?: boolean;
  showWishlist?: boolean;
  socialLinks?: SocialLink[];
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
  showWishlist: boolean;
  bio?: string;
  avatar?: string;
  socialLinks?: SocialLink[];
  createdAt: string;
  updatedAt: string;
  stats: {
    totalPlants: number;
    totalShelves: number;
    followersCount: number;
  };
}
