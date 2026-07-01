// ==================== AUTH TYPES ====================
// Define all authentication and role-based access types

export type UserRole = 'admin' | 'support' | 'customer' | 'sales';
export type CustomerStatus = 'active' | 'inactive' | 'pending';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
  id: string; // e.g., 'cust-001'
  name: string; // e.g., 'Empresa X'
  status: CustomerStatus;
  maxUsers: number; // Limite de usuários permitidos
  currentUserCount: number; // Usuários ativos vinculados
  createdAt: string;
  createdBy?: string; // Email do admin que criou
  metadata?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface AuthUser {
  id: string; // e.g., 'user-001'
  email: string;
  name: string;
  role: UserRole;
  customerId?: string; // Vínculo com customer (obrigatório para support/customer)
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  metadata?: {
    department?: string;
    phone?: string;
  };
}

export interface UserCustomerMapping {
  id: string;
  userId: string;
  customerId: string;
  linkedAt: string;
  linkedBy: string; // Email do admin que fez a vinculação
  reason?: string; // Motivo da vinculação
}

export interface LoginCredentials {
  email: string;
  password: string;
  name?: string; // Usado apenas para novo registro
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'USER_NOT_FOUND' | 'USER_BLOCKED' | 'CUSTOMER_INACTIVE' | 'SALES_CANNOT_LOGIN' | 'INVALID_ROLE' | 'CUSTOMER_FULL' | 'UNAUTHORIZED';
  message: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser & { customerData?: Customer };
  error?: AuthError;
}
