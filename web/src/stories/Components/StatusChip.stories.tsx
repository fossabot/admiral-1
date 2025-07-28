import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Typography, Box } from '@mui/material';
import { StatusChip } from '@/components';

const meta: Meta<typeof StatusChip> = {
  title: 'Components/StatusChip',
  component: StatusChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A semantic status indicator component that automatically maps status types to appropriate colors and icons.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['running', 'healthy', 'error', 'warning', 'pending', 'stopped', 'deploying', 'failed', 'success'],
      description: 'Status type that determines color and icon',
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
      description: 'Size of the chip',
    },
    variant: {
      control: 'select',
      options: ['filled', 'outlined'],
      description: 'Visual variant of the chip',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusChip>;

export const Default: Story = {
  args: {
    status: 'running',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Success States
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="running" />
          <StatusChip status="healthy" />
          <StatusChip status="success" />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Warning States
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="warning" />
          <StatusChip status="pending" />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Error States
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="error" />
          <StatusChip status="failed" />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Neutral States
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="stopped" />
          <StatusChip status="deploying" />
        </Stack>
      </Box>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Small Size
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="running" size="small" />
          <StatusChip status="warning" size="small" />
          <StatusChip status="error" size="small" />
          <StatusChip status="stopped" size="small" />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Medium Size (Default)
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="running" size="medium" />
          <StatusChip status="warning" size="medium" />
          <StatusChip status="error" size="medium" />
          <StatusChip status="stopped" size="medium" />
        </Stack>
      </Box>
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filled (Default)
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="running" variant="filled" />
          <StatusChip status="warning" variant="filled" />
          <StatusChip status="error" variant="filled" />
          <StatusChip status="stopped" variant="filled" />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Outlined
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatusChip status="running" variant="outlined" />
          <StatusChip status="warning" variant="outlined" />
          <StatusChip status="error" variant="outlined" />
          <StatusChip status="stopped" variant="outlined" />
        </Stack>
      </Box>
    </Stack>
  ),
};

export const UsageExamples: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Application Status
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">Web Server:</Typography>
          <StatusChip status="running" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="body2">Database:</Typography>
          <StatusChip status="healthy" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="body2">Cache:</Typography>
          <StatusChip status="warning" />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Deployment Status
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">Frontend:</Typography>
          <StatusChip status="success" size="small" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="body2">API:</Typography>
          <StatusChip status="deploying" size="small" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="body2">Workers:</Typography>
          <StatusChip status="pending" size="small" />
        </Stack>
      </Box>
    </Stack>
  ),
};
