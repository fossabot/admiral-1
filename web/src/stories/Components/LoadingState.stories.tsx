import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Typography, Box, Paper } from '@mui/material';
import { LoadingState } from '@/components';

const meta: Meta<typeof LoadingState> = {
  title: 'Components/LoadingState',
  component: LoadingState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A flexible loading indicator component with support for different variants, sizes, and messages.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['circular', 'linear', 'skeleton'],
      description: 'Type of loading indicator',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the loading indicator',
    },
    message: {
      control: 'text',
      description: 'Optional loading message',
    },
    overlay: {
      control: 'boolean',
      description: 'Show as overlay with backdrop',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (for linear variant)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {
  args: {},
};

export const WithMessage: Story = {
  args: {
    message: 'Loading application data...',
  },
};

export const Variants: Story = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Circular (Default)
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <LoadingState variant="circular" message="Loading..." />
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Linear
        </Typography>
        <Paper sx={{ p: 3 }}>
          <LoadingState variant="linear" message="Processing request..." />
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Linear with Progress
        </Typography>
        <Paper sx={{ p: 3 }}>
          <LoadingState variant="linear" progress={65} message="Uploading files... 65%" />
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Skeleton
        </Typography>
        <Paper sx={{ p: 3 }}>
          <LoadingState variant="skeleton" />
        </Paper>
      </Box>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Small
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <LoadingState size="small" message="Loading..." />
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Medium (Default)
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <LoadingState size="medium" message="Loading..." />
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Large
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <LoadingState size="large" message="Loading..." />
        </Paper>
      </Box>
    </Stack>
  ),
};

export const InlineLoading: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Small Inline Indicators
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">Refreshing data</Typography>
          <LoadingState size="small" sx={{ display: 'inline-flex' }} />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="body2">Saving changes</Typography>
          <LoadingState variant="linear" size="small" sx={{ minWidth: 100 }} />
        </Stack>
      </Box>
    </Stack>
  ),
};

export const OverlayLoading: Story = {
  render: () => (
    <Paper sx={{ p: 3, position: 'relative', minHeight: 200 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Content Behind Overlay
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This content is behind a loading overlay. The overlay prevents interaction
        while maintaining visual context.
      </Typography>
      <LoadingState
        overlay
        message="Processing request..."
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </Paper>
  ),
};

export const UsageExamples: Story = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Page Loading
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center', minHeight: 150 }}>
          <LoadingState message="Loading application details..." />
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Form Submission
        </Typography>
        <Paper sx={{ p: 3 }}>
          <LoadingState
            variant="linear"
            message="Saving configuration..."
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Please wait while we save your changes.
          </Typography>
        </Paper>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Data Refresh
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <LoadingState size="small" />
          <Typography variant="body2" color="text.secondary">
            Refreshing dashboard data...
          </Typography>
        </Stack>
      </Box>
    </Stack>
  ),
};
