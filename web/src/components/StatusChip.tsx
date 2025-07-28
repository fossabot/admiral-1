import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { statusColors } from './theme-utils.ts';

export type StatusType = keyof typeof statusColors;

export interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusType | string;
  showIcon?: boolean;
  customIcon?: React.ReactNode;
}

const statusIcons: Record<string, React.ReactNode> = {
  // Success states
  running: <SuccessIcon fontSize="small" />,
  healthy: <SuccessIcon fontSize="small" />,
  active: <SuccessIcon fontSize="small" />,
  completed: <SuccessIcon fontSize="small" />,
  success: <SuccessIcon fontSize="small" />,

  // Warning states
  warning: <WarningIcon fontSize="small" />,
  degraded: <WarningIcon fontSize="small" />,
  pending: <PendingIcon fontSize="small" />,

  // Error states
  error: <ErrorIcon fontSize="small" />,
  failed: <ErrorIcon fontSize="small" />,
  unhealthy: <ErrorIcon fontSize="small" />,

  // Neutral states
  stopped: <CancelIcon fontSize="small" />,
  inactive: <BlockIcon fontSize="small" />,
  disabled: <BlockIcon fontSize="small" />,
  cancelled: <CancelIcon fontSize="small" />,

  // Info states
  info: <InfoIcon fontSize="small" />,
  unknown: <InfoIcon fontSize="small" />,
};

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  showIcon = true,
  customIcon,
  size = 'small',
  variant = 'filled',
  ...props
}) => {
  const normalizedStatus = status.toLowerCase();
  const color = statusColors[normalizedStatus as StatusType] || 'default';
  const icon = showIcon ? (customIcon || statusIcons[normalizedStatus]) : undefined;

  // Format label - capitalize first letter, handle edge cases
  const label = status.trim() ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : status;

  return (
    <Chip
      label={label}
      color={color as 'success' | 'warning' | 'error' | 'info' | 'default'}
      icon={icon as React.ReactElement}
      size={size}
      variant={variant}
      {...props}
    />
  );
};
