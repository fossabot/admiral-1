import { useState, useCallback } from 'react';

import { services } from '@/services';
import type { User } from '@/types/user';

export const useUserData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersWithCurrent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResp, currentUserData] = await Promise.all([services.user.list({}), services.user.me()]);

      setUsers(usersResp.items);
      setCurrentUser(currentUserData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  return {
    users,
    currentUser,
    loading,
    error,
    isInitialized,
    fetchUsersWithCurrent,
  };
};
