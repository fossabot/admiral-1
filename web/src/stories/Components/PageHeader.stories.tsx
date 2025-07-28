import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, IconButton, Chip, Stack, Box, Typography } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Home as HomeIcon, Apps as AppsIcon } from '@mui/icons-material';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from '@/components';

const meta: Meta<typeof PageHeader> = {
  title: 'Components/PageHeader',
  component: PageHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A consistent page header component with breadcrumbs, title, description, and action buttons.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main page title',
    },
    description: {
      control: 'text',
      description: 'Optional page description',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Applications',
    description: 'Manage your applications and deployments',
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: 'Application Details',
    description: 'View and manage application configuration',
    breadcrumbs: [
      { label: 'Home', href: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Applications', href: '/applications', icon: <AppsIcon fontSize="small" /> },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: 'User Management',
    description: 'Manage users and their permissions',
    actions: (
      <>
        <IconButton>
          <RefreshIcon />
        </IconButton>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add User
        </Button>
      </>
    ),
  },
};

export const WithBadge: Story = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Chip Badge</Typography>
        <PageHeader
          title="Production Environment"
          description="Using a properly sized chip for interactive badges"
          badge={<Chip label="PROD" color="error" size="small" sx={{ height: 20, fontSize: '0.75rem' }} />}
        />
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Typography Badge</Typography>
        <PageHeader
          title="Application Dashboard"
          description="Using typography for clean, minimal badges"
          badge={
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 500
              }}
            >
              v2.1.0
            </Typography>
          }
        />
      </Box>
    </Stack>
  ),
};

export const Loading: Story = {
  args: {
    title: 'Loading Application',
    description: 'Please wait while we load the application details',
    loading: true,
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Applications', href: '/applications' },
    ],
  },
};

export const Complete: Story = {
  args: {
    title: 'Application Dashboard',
    description: 'Monitor your application performance and health',
    breadcrumbs: [
      { label: 'Home', href: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Applications', href: '/applications', icon: <AppsIcon fontSize="small" /> },
    ],
    badge: <Chip label="v2.1.0" color="primary" variant="outlined" size="small" sx={{ height: 20, fontSize: '0.75rem' }} />,
    actions: (
      <>
        <IconButton title="Refresh">
          <RefreshIcon />
        </IconButton>
        <Button variant="outlined" size="small">
          Settings
        </Button>
        <Button variant="contained" startIcon={<AddIcon />}>
          Deploy
        </Button>
      </>
    ),
  },
};
