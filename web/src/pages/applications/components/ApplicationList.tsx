import React, { useRef } from 'react';
import { Card, CardContent, Stack, CircularProgress, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { useInfiniteScroll } from '../hooks/use-infinite-scroll';
import type { Application as App } from '@/types/application';

type ApplicationListProps = {
  apps: App[];
  nextCursor: string | null;
  loading: boolean;
  fetchPage: (cursor: string | null, filter?: string) => Promise<void>;
};

const ApplicationList: React.FC<ApplicationListProps> = ({ apps, nextCursor, loading, fetchPage }) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScroll({ loadMoreRef, nextCursor, loading, fetchPage });

  if (apps.length === 0 && !loading) {
      return (
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ py: 6 }}
      >
        <Typography variant="h3" color="text.secondary">
          No applications found.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={0}>
      {apps.map((app, idx) => (
        <Card
          key={app.id}
          elevation={0}
          sx={(theme) => ({
            borderBottom: idx === apps.length - 1 ? 'none' : `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
          })}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              variant="h3"
              component={Link}
              to={`/applications/${app.id}`}
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: 'bold',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'none',
                },
              }}
            >
              {app.name}
            </Typography>
            <Box sx={{ overflowY: 'auto', color: 'text.secondary', typography: 'body2' }}>{app.description}</Box>
          </CardContent>
        </Card>
      ))}
      <Box ref={loadMoreRef} sx={{ height: 1 }} />
      {loading && (
        <Stack justifyContent="center" alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={24} />
        </Stack>
      )}
    </Stack>
  );
};

export default ApplicationList;
