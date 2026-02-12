// Core types for Boxcord

// User info from Boxtime/Cognito
export interface AuthUser {
  id: string; // Cognito sub / Boxtime user.id
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}

// Pagination
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
