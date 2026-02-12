// Boxtime Integration Service
// Fetches user data and other info from Boxtime API

export interface BoxtimeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  officeId?: number;
  pictureUrl?: string;
}

export interface BoxtimeStaff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  officeId: number;
}

export class BoxtimeService {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ?? process.env.BOXTIME_API_URL ?? 'http://localhost:3000';
  }

  private async request<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(
        `Boxtime API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get current user profile from Boxtime
   */
  async getCurrentUser(token: string): Promise<BoxtimeUser> {
    return this.request<BoxtimeUser>('/api/v1/users/me', token);
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string, token: string): Promise<BoxtimeUser> {
    return this.request<BoxtimeUser>(`/api/v1/users/${userId}`, token);
  }

  /**
   * Get multiple users by IDs (for displaying message authors)
   */
  async getUsers(userIds: string[], token: string): Promise<BoxtimeUser[]> {
    const queryParams = userIds.map((id) => `ids=${id}`).join('&');
    return this.request<BoxtimeUser[]>(`/api/v1/users?${queryParams}`, token);
  }

  /**
   * Get staff members (warehouse workers)
   */
  async getStaffByOffice(
    officeId: number,
    token: string
  ): Promise<BoxtimeStaff[]> {
    return this.request<BoxtimeStaff[]>(
      `/api/v1/staff?officeId=${officeId}`,
      token
    );
  }

  /**
   * Search users by name/email
   */
  async searchUsers(query: string, token: string): Promise<BoxtimeUser[]> {
    return this.request<BoxtimeUser[]>(
      `/api/v1/users/search?q=${encodeURIComponent(query)}`,
      token
    );
  }
}

// Singleton instance
export const boxtimeService = new BoxtimeService();
