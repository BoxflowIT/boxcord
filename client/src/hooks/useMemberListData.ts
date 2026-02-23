// Custom hook for member list data processing
import { useMemo } from 'react';

export interface MemberUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
  status?: string; // Custom status message
  statusEmoji?: string; // Custom status emoji
  presence?: {
    status: string;
    customStatus?: string;
    lastSeen?: string;
  };
}

interface UseMemberListDataProps {
  users: MemberUser[];
  searchQuery: string;
}

const ROLE_ORDER = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administratörer',
  STAFF: 'Personal'
};

/**
 * Hook to filter and group users by role
 * Returns filtered users and grouped data
 */
export function useMemberListData({
  users,
  searchQuery
}: UseMemberListDataProps) {
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`
        .toLowerCase()
        .trim();
      const email = user.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [users, searchQuery]);

  const groupedByRole = useMemo(() => {
    return filteredUsers.reduce(
      (acc, user) => {
        const role = user.role || 'STAFF';
        if (!acc[role]) acc[role] = [];
        acc[role].push(user);
        return acc;
      },
      {} as Record<string, MemberUser[]>
    );
  }, [filteredUsers]);

  return {
    filteredUsers,
    groupedByRole,
    roleOrder: ROLE_ORDER
  };
}
