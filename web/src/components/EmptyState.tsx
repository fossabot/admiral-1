import React from 'react';
import { Box, Typography, Button, SvgIcon } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { spacingValues } from './theme-utils.ts';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  actions?: React.ReactNode;
  height?: number | string;
  sx?: object;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  actions,
  height = 400,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: height,
        p: spacingValues.xl,
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: spacingValues.lg,
            color: 'text.disabled',
            '& .MuiSvgIcon-root': {
              fontSize: 64,
            },
          }}
        >
          {typeof icon === 'string' ? (
            <SvgIcon sx={{ fontSize: 64 }}>
              <path d={icon} />
            </SvgIcon>
          ) : (
            icon
          )}
        </Box>
      )}

      <Typography
        variant="h6"
        sx={{
          mb: spacingValues.sm,
          fontWeight: 600,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          sx={{
            mb: spacingValues.lg,
            color: 'text.secondary',
            maxWidth: 400,
          }}
        >
          {description}
        </Typography>
      )}

      {(action || secondaryAction || actions) && (
        <Box
          sx={{
            display: 'flex',
            gap: spacingValues.md,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {actions ? (
            actions
          ) : (
            <>
              {action && (
                <Button
                  variant="contained"
                  onClick={action.onClick}
                  startIcon={action.icon || <AddIcon />}
                >
                  {action.label}
                </Button>
              )}

              {secondaryAction && (
                <Button
                  variant="outlined"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};
