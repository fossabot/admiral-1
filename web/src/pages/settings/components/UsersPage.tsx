import React, { useEffect } from 'react';
import {
  Typography,
  Box,
  Avatar,
  Alert,
} from '@mui/material';

import type { User } from '@/types/user';
import { useUserData } from '../hooks/use-user-data';
import { DataTable, PageHeader, StatusChip } from '@/components';
import type { Column } from '@/components';

const UsersPage: React.FC = () => {
  const { users, currentUser, loading, error, fetchUsersWithCurrent } = useUserData();

  useEffect(() => {
    fetchUsersWithCurrent().catch(console.error);
  }, [fetchUsersWithCurrent]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const columns: Column<User>[] = [
    {
      id: 'name',
      label: 'Name',
      format: (_, user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={user.pictureUrl} alt={user.name || user.email} sx={{ width: 32, height: 32 }}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2">
              {user.name || 'N/A'}
              {currentUser?.id === user.id && (
                <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
                  (You)
                </Typography>
              )}
            </Typography>
            {user.givenName || user.familyName ? (
              <Typography variant="caption" color="text.secondary">
                {[user.givenName, user.familyName].filter(Boolean).join(' ')}
              </Typography>
            ) : null}
          </Box>
        </Box>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      format: (value) => <Typography variant="body2">{value as string}</Typography>,
    },
    {
      id: 'emailVerified',
      label: 'Email Verified',
      format: (value) => (
        <StatusChip
          status={value ? 'healthy' : 'warning'}
          label={value ? 'Verified' : 'Not Verified'}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      format: (value) => <Typography variant="body2">{formatDate(value as string)}</Typography>,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        description="Manage users in your organization. View user profiles, email verification status, and account details."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={users}
        keyField="id"
        loading={loading}
        error={error}
        emptyState={{
          title: 'No users found',
          description: 'There are no users in your organization yet.',
        }}
      />
    </Box>
  );
};

export default UsersPage;
