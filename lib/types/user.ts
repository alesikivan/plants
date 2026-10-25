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

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface DeviceInfo {
  userAgent: string;
  os: string;
  browser: string;
  deviceType: DeviceType;
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
  telegramPublishPlants: boolean;
  telegramPublishHistory: boolean;
  telegramBannerDismissed: boolean;
  bio?: string;
  avatar?: string;
  socialLinks?: SocialLink[];
  // Admin listing only
  registrationDevice?: DeviceInfo | null;
  lastDevice?: DeviceInfo | null;
  lastSeenAt?: string | null;
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
  telegramPublishPlants?: boolean;
  telegramPublishHistory?: boolean;
  telegramBannerDismissed?: boolean;
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
