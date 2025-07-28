// Minimal theme utilities for shared components
// This replaces the need for complex style guide infrastructure

export const spacingValues = {
  xxs: 0.5,  // 4px
  xs: 1,     // 8px
  sm: 1.5,   // 12px
  md: 2,     // 16px
  lg: 3,     // 24px
  xl: 4,     // 32px
  xxl: 5,    // 40px
  xxxl: 6,   // 48px
  sectionSpacing: 4, // 32px - for major page sections
} as const;

export const statusColors = {
  // Success states
  running: 'success',
  healthy: 'success',
  active: 'success',
  completed: 'success',
  success: 'success',

  // Error states
  error: 'error',
  failed: 'error',
  unhealthy: 'error',

  // Warning states
  warning: 'warning',
  pending: 'warning',
  degraded: 'warning',

  // Info states
  info: 'info',
  unknown: 'info',
  deploying: 'info',

  // Neutral/default states
  stopped: 'default',
  inactive: 'default',
  disabled: 'default',
  cancelled: 'default',
} as const;

export type SpacingValue = keyof typeof spacingValues;
export type StatusType = keyof typeof statusColors;
