import React from 'react';
import { Container, ContainerProps } from '@mui/material';
import { spacingValues } from './theme-utils';

export interface PageContainerProps extends Omit<ContainerProps, 'maxWidth'> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  variant?: 'standard' | 'simple';
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = 'lg',
  variant = 'simple',
  children,
  sx = {},
  ...props
}) => {
  const containerStyles = {
    py: spacingValues.lg, // 24px vertical padding
    ...(variant === 'standard' && {
      px: spacingValues.md, // 16px horizontal padding
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 1,
    }),
    ...(variant === 'simple' && {
      px: spacingValues.lg, // 24px padding all around
    }),
    ...sx,
  };

  return (
    <Container
      maxWidth={maxWidth}
      sx={containerStyles}
      {...props}
    >
      {children}
    </Container>
  );
};
