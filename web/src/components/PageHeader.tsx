import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Stack,
  Skeleton,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { spacingValues } from './theme-utils.ts';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  loading?: boolean;
  badge?: React.ReactNode;
  sx?: object;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions,
  loading = false,
  badge,
  sx = {},
}) => {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <HomeIcon fontSize="small" /> },
    ...breadcrumbs,
  ];

  return (
    <Box sx={{ mb: spacingValues.sectionSpacing, ...sx }}>
      {/* Breadcrumbs */}
      {defaultBreadcrumbs.length > 1 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          {defaultBreadcrumbs.map((crumb, index) => {
            const isLast = index === defaultBreadcrumbs.length - 1;

            if (loading && isLast) {
              return (
                <Skeleton key={index} width={100} height={20} />
              );
            }

            if (isLast || !crumb.href) {
              return (
                <Typography
                  key={index}
                  color="text.primary"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  {crumb.icon}
                  {crumb.label}
                </Typography>
              );
            }

            return (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.href}
                color="inherit"
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {crumb.icon}
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header Content */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {loading ? (
              <Skeleton variant="text" width={300} height={40} />
            ) : (
              <>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </Typography>
                {badge}
              </>
            )}
          </Stack>

          {description && (
            loading ? (
              <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {description}
              </Typography>
            )
          )}
        </Box>

        {actions && !loading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};
