import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  useTheme,
} from '@mui/material';
import { StatusChip } from '@/components';

const meta: Meta = {
  title: 'Design System/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Admiral color palette including primary, secondary, status, and grey scale colors with usage guidelines.',
      },
    },
  },
};

export default meta;

interface ColorSwatchProps {
  color: string;
  name: string;
  description?: string;
  textColor?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, name, description, textColor = '#fff' }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => copyToClipboard(color)}
    >
      <Box
        sx={{
          backgroundColor: color,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: textColor,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, color: textColor }}>
          Click to copy
        </Typography>
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mb: 1 }}>
          {color}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const PrimaryColors: StoryObj = {
  render: () => {
    const theme = useTheme();

    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Primary Colors
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Main brand colors used for primary actions, links, and key interface elements.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            <ColorSwatch
              color={theme.palette.primary.light}
              name="Primary Light"
              description="Hover states, light backgrounds"
            />
            <ColorSwatch
              color={theme.palette.primary.main}
              name="Primary Main"
              description="Default primary color"
            />
            <ColorSwatch
              color={theme.palette.primary.dark}
              name="Primary Dark"
              description="Active states, emphasis"
            />
          </Box>
        </Box>
      </Stack>
    );
  },
};

export const SecondaryColors: StoryObj = {
  render: () => {
    const theme = useTheme();

    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Secondary Colors
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Supporting brand colors for secondary actions and accent elements.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            <ColorSwatch
              color={theme.palette.secondary.light}
              name="Secondary Light"
              description="Light accent elements"
            />
            <ColorSwatch
              color={theme.palette.secondary.main}
              name="Secondary Main"
              description="Default secondary color"
            />
            <ColorSwatch
              color={theme.palette.secondary.dark}
              name="Secondary Dark"
              description="Strong secondary emphasis"
            />
          </Box>
        </Box>
      </Stack>
    );
  },
};

export const StatusColors: StoryObj = {
  render: () => {
    const theme = useTheme();

    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Status Colors
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Semantic colors for status indication, alerts, and feedback messages.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            <ColorSwatch
              color={theme.palette.success.main}
              name="Success"
              description="Success states, positive feedback"
            />
            <ColorSwatch
              color={theme.palette.warning.main}
              name="Warning"
              description="Warning states, caution"
              textColor="#000"
            />
            <ColorSwatch
              color={theme.palette.error.main}
              name="Error"
              description="Error states, destructive actions"
            />
            <ColorSwatch
              color={theme.palette.info.main}
              name="Info"
              description="Informational messages"
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Status Chip Examples
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <StatusChip status="running" />
            <StatusChip status="healthy" />
            <StatusChip status="error" />
            <StatusChip status="warning" />
            <StatusChip status="pending" />
            <StatusChip status="stopped" />
          </Stack>
        </Box>
      </Stack>
    );
  },
};

export const GreyScale: StoryObj = {
  render: () => {
    const theme = useTheme();

    const greyColors = [
      { color: theme.palette.grey[50], name: 'Grey 50', usage: 'Light backgrounds' },
      { color: theme.palette.grey[100], name: 'Grey 100', usage: 'Subtle backgrounds' },
      { color: theme.palette.grey[200], name: 'Grey 200', usage: 'Light borders' },
      { color: theme.palette.grey[300], name: 'Grey 300', usage: 'Default borders' },
      { color: theme.palette.grey[400], name: 'Grey 400', usage: 'Placeholder text' },
      { color: theme.palette.grey[500], name: 'Grey 500', usage: 'Secondary text' },
      { color: theme.palette.grey[600], name: 'Grey 600', usage: 'Medium text' },
      { color: theme.palette.grey[700], name: 'Grey 700', usage: 'Primary text' },
      { color: theme.palette.grey[800], name: 'Grey 800', usage: 'Dark text' },
      { color: theme.palette.grey[900], name: 'Grey 900', usage: 'High contrast text' },
    ];

    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Grey Scale
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Neutral colors for text, borders, backgrounds, and subtle UI elements.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {greyColors.map((grey, index) => (
              <ColorSwatch
                key={index}
                color={grey.color}
                name={grey.name}
                description={grey.usage}
                textColor={index < 4 ? '#000' : '#fff'}
              />
            ))}
          </Box>
        </Box>
      </Stack>
    );
  },
};

// All colors story removed due to ESLint parsing issues with .render() calls
