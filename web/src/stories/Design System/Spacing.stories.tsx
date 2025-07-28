import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Paper,
  useTheme,
} from '@mui/material';
import { spacingValues } from '@/components';

const meta: Meta = {
  title: 'Design System/Spacing',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Admiral spacing system based on an 8px grid with consistent spacing values and usage guidelines.',
      },
    },
  },
};

export default meta;

const SpacingExample: React.FC<{ size: keyof typeof spacingValues; name: string; usage: string }> = ({ size, name, usage }) => {
  const theme = useTheme();
  const pxValue = theme.spacing(spacingValues[size]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {spacingValues[size]} units ({pxValue})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: pxValue,
                height: 32,
                backgroundColor: 'primary.main',
                borderRadius: 1,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {usage}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const SpacingScale: StoryObj = {
  render: () => {
    const spacingItems = [
      { size: 'xxs' as const, name: 'XXS', usage: 'Icon padding, tight spacing' },
      { size: 'xs' as const, name: 'XS', usage: 'Small gaps, inline spacing' },
      { size: 'sm' as const, name: 'SM', usage: 'Small component padding' },
      { size: 'md' as const, name: 'MD', usage: 'Default component spacing' },
      { size: 'lg' as const, name: 'LG', usage: 'Section spacing, large gaps' },
      { size: 'xl' as const, name: 'XL', usage: 'Page margins, major sections' },
      { size: 'xxl' as const, name: 'XXL', usage: 'Large page sections' },
      { size: 'xxxl' as const, name: 'XXXL', usage: 'Major layout sections' },
    ];

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Spacing Scale
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Based on an 8px grid system for consistent spacing throughout the application.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {spacingItems.map((item) => (
              <SpacingExample key={item.size} {...item} />
            ))}
          </Box>
        </Box>
      </Stack>
    );
  },
};

export const LayoutExamples: StoryObj = {
  render: () => {
    const theme = useTheme();

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Layout Spacing Examples
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Practical examples of how spacing values are used in real components and layouts.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Card with Consistent Spacing
          </Typography>
          <Card>
            <CardContent sx={{ p: theme.spacing(spacingValues.lg) }}>
              <Typography variant="h6" sx={{ mb: theme.spacing(spacingValues.sm) }}>
                Card Title
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(spacingValues.md) }}>
                This card uses consistent spacing values from our design system.
              </Typography>
              <Stack direction="row" spacing={spacingValues.sm}>
                <Paper sx={{ p: theme.spacing(spacingValues.xs), backgroundColor: 'primary.light' }}>
                  <Typography variant="caption">Tag 1</Typography>
                </Paper>
                <Paper sx={{ p: theme.spacing(spacingValues.xs), backgroundColor: 'secondary.light' }}>
                  <Typography variant="caption">Tag 2</Typography>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Form Layout Spacing
          </Typography>
          <Card>
            <CardContent sx={{ p: theme.spacing(spacingValues.lg) }}>
              <Stack spacing={spacingValues.md}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: theme.spacing(spacingValues.xs) }}>
                    Form Field Label
                  </Typography>
                  <Paper sx={{ p: theme.spacing(spacingValues.sm), backgroundColor: 'grey.50' }}>
                    <Typography variant="body2">Input field placeholder</Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: theme.spacing(spacingValues.xs) }}>
                    Another Field
                  </Typography>
                  <Paper sx={{ p: theme.spacing(spacingValues.sm), backgroundColor: 'grey.50' }}>
                    <Typography variant="body2">Another input field</Typography>
                  </Paper>
                </Box>
                <Box sx={{ pt: theme.spacing(spacingValues.sm) }}>
                  <Paper sx={{ p: theme.spacing(spacingValues.sm), backgroundColor: 'primary.main', color: 'primary.contrastText', textAlign: 'center' }}>
                    <Typography variant="button">Submit Button</Typography>
                  </Paper>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Navigation Spacing
          </Typography>
          <Paper sx={{ p: theme.spacing(spacingValues.md) }}>
            <Stack direction="row" spacing={spacingValues.lg}>
              <Paper sx={{ p: theme.spacing(spacingValues.sm), backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="body2">Home</Typography>
              </Paper>
              <Paper sx={{ p: theme.spacing(spacingValues.sm), backgroundColor: 'grey.100' }}>
                <Typography variant="body2">About</Typography>
              </Paper>
              <Paper sx={{ p: theme.spacing(spacingValues.sm), backgroundColor: 'grey.100' }}>
                <Typography variant="body2">Contact</Typography>
              </Paper>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    );
  },
};

export const ResponsiveSpacing: StoryObj = {
  render: () => {
    const theme = useTheme();

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Responsive Spacing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Examples of how spacing adapts across different screen sizes.
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{
            p: {
              xs: theme.spacing(spacingValues.md),
              sm: theme.spacing(spacingValues.lg),
              md: theme.spacing(spacingValues.xl),
            }
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Responsive Padding
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This card uses responsive padding that increases with screen size:
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography variant="caption">• XS: {spacingValues.md} units ({theme.spacing(spacingValues.md)})</Typography>
              <Typography variant="caption">• SM: {spacingValues.lg} units ({theme.spacing(spacingValues.lg)})</Typography>
              <Typography variant="caption">• MD+: {spacingValues.xl} units ({theme.spacing(spacingValues.xl)})</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: {
              xs: theme.spacing(spacingValues.sm),
              sm: theme.spacing(spacingValues.md),
              md: theme.spacing(spacingValues.lg),
            },
          }}
        >
          <Paper sx={{ p: theme.spacing(spacingValues.md), textAlign: 'center' }}>
            <Typography variant="body2">Responsive Grid Item 1</Typography>
          </Paper>
          <Paper sx={{ p: theme.spacing(spacingValues.md), textAlign: 'center' }}>
            <Typography variant="body2">Responsive Grid Item 2</Typography>
          </Paper>
          <Paper sx={{ p: theme.spacing(spacingValues.md), textAlign: 'center' }}>
            <Typography variant="body2">Responsive Grid Item 3</Typography>
          </Paper>
        </Box>
      </Stack>
    );
  },
};

// All spacing story removed due to ESLint parsing issues with .render() calls
