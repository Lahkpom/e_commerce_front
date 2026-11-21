export type UserRole = 'ADMIN' | 'OPERATOR' | 'WHOLESALER' | 'CUSTOMER';

export type TaxIdType = 'DNI' | 'CUIL' | 'CUIT' | 'PASAPORTE';
export type UserSegment = 'CLIENTS' | 'OPERATORS';
export type UserRowStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface UserResponse {
  userId: string;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  companyName: string | null;
  taxIdType: TaxIdType | null;
  taxIdNumber: string | null;
  lastLoginAt: string | null;
  passwordExpiresAt: string;
  rowStatus: UserRowStatus;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  taxIdType?: TaxIdType;
  taxIdNumber?: string;
}

export interface WholesalerCreateRequest {
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  taxIdType: 'CUIT';
  taxIdNumber: string;
}

export interface OperatorCreateRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface AdminUserUpdateRequest {
  userRole: UserRole;
  companyName?: string | null;
  taxIdType?: TaxIdType | null;
  taxIdNumber?: string | null;
}

export interface ExpiredPasswordResetRequest {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  user: UserResponse;
}

export interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
