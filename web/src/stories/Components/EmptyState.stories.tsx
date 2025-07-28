import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Stack, Typography, Box } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Inbox as InboxIcon, CloudOff as CloudOffIcon } from '@mui/icons-material';
import { EmptyState } from '@/components';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A consistent empty state component with icon, title, description, and optional actions.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main empty state title',
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
    height: {
      control: { type: 'range', min: 100, max: 600, step: 50 },
      description: 'Height of the empty state container',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No data available',
    description: 'There are no items to display at the moment.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <InboxIcon />,
    title: 'No applications found',
    description: 'You haven\'t created any applications yet.',
  },
};

export const WithActions: Story = {
  args: {
    icon: <AddIcon />,
    title: 'No applications found',
    description: 'Get started by creating your first application.',
    actions: (
      <Button variant="contained" startIcon={<AddIcon />}>
        Create Application
      </Button>
    ),
  },
};

export const SearchEmpty: Story = {
  args: {
    icon: <SearchIcon />,
    title: 'No results found',
    description: 'Try adjusting your search criteria or filters.',
    actions: (
      <Button variant="outlined">
        Clear Filters
      </Button>
    ),
  },
};

export const ErrorState: Story = {
  args: {
    icon: <CloudOffIcon />,
    title: 'Connection Error',
    description: 'Unable to load data. Please check your connection and try again.',
    actions: (
      <Stack direction="row" spacing={2}>
        <Button variant="outlined">
          Try Again
        </Button>
        <Button variant="contained">
          Refresh Page
        </Button>
      </Stack>
    ),
  },
};

export const CustomHeight: Story = {
  args: {
    icon: <InboxIcon />,
    title: 'Custom Height',
    description: 'This empty state has a custom height of 300px.',
    height: 300,
  },
};

export const UsageExamples: Story = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          List/Table Empty State
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <EmptyState
            icon={<InboxIcon />}
            title="No users found"
            description="No users have been added to this organization yet."
            actions={
              <Button variant="contained" startIcon={<AddIcon />}>
                Invite User
              </Button>
            }
            height={250}
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Search Results Empty
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <EmptyState
            icon={<SearchIcon />}
            title="No matching applications"
            description="No applications match your current search criteria."
            actions={
              <Stack direction="row" spacing={2}>
                <Button variant="outlined">
                  Clear Search
                </Button>
                <Button variant="contained">
                  View All
                </Button>
              </Stack>
            }
            height={250}
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Error State
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <EmptyState
            icon={<CloudOffIcon />}
            title="Failed to load data"
            description="An error occurred while fetching the data. Please try again."
            actions={
              <Button variant="contained">
                Retry
              </Button>
            }
            height={250}
          />
        </Box>
      </Box>
    </Stack>
  ),
};
