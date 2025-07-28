import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, Button, Chip, IconButton, Stack, Typography, Tooltip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { StatusChip } from '@/components/StatusChip';
import { DataTable, Column } from '@/components/DataTable';

interface User extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  department: string;
}

const meta: Meta<typeof DataTable<User>> = {
  title: 'Components/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A feature-rich data table component with sorting, pagination, selection, and custom formatting.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<User>>;

const sampleData: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'active', lastLogin: '2024-01-15', department: 'Engineering' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Developer', status: 'active', lastLogin: '2024-01-14', department: 'Engineering' },
  { id: '3', name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Designer', status: 'inactive', lastLogin: '2024-01-10', department: 'Design' },
  { id: '4', name: 'Alice Brown', email: 'alice.brown@example.com', role: 'Manager', status: 'active', lastLogin: '2024-01-15', department: 'Product' },
  { id: '5', name: 'Charlie Wilson', email: 'charlie.wilson@example.com', role: 'Developer', status: 'pending', lastLogin: '2024-01-12', department: 'Engineering' },
  { id: '6', name: 'Diana Lee', email: 'diana.lee@example.com', role: 'QA Engineer', status: 'active', lastLogin: '2024-01-15', department: 'Quality' },
  { id: '7', name: 'Ethan Davis', email: 'ethan.davis@example.com', role: 'DevOps', status: 'active', lastLogin: '2024-01-14', department: 'Operations' },
  { id: '8', name: 'Fiona Green', email: 'fiona.green@example.com', role: 'Product Owner', status: 'active', lastLogin: '2024-01-13', department: 'Product' },
];

const columns: Column<User>[] = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
  { id: 'role', label: 'Role', sortable: true },
  {
    id: 'status',
    label: 'Status',
    sortable: true,
    format: (value) => {
      const status = value as User['status'];
      return <StatusChip status={status} size="small" />;
    },
  },
  { id: 'department', label: 'Department', sortable: true },
  { id: 'lastLogin', label: 'Last Login', sortable: true },
];

export const Basic: Story = {
  args: {
    columns,
    rows: sampleData,
    keyField: 'id' as keyof User,
  },
};

export const WithLoading: Story = {
  args: {
    columns,
    rows: [],
    keyField: 'id' as keyof User,
    loading: true,
  },
};

export const EmptyData: Story = {
  args: {
    columns,
    rows: [],
    keyField: 'id' as keyof User,
    loading: false,
    emptyState: {
      title: 'No users found',
      description: 'Try adjusting your search or filters',
    },
  },
};

export const WithSelection: Story = {
  render: () => {
    const [selected, setSelected] = useState<User[]>([]);

    return (
      <Box>
        {selected.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              {selected.length} user(s) selected
            </Typography>
          </Box>
        )}
        <DataTable<User>
          columns={columns}
          rows={sampleData}
          keyField="id"
          selectable
          onSelectionChange={(selected) => setSelected(selected as User[])}
        />
      </Box>
    );
  },
};

export const WithRowActions: Story = {
  args: {
    columns: [
      ...columns,
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        format: () => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="View">
              <IconButton size="small">
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    rows: sampleData,
    keyField: 'id' as keyof User,
  },
};

export const Clickable: Story = {
  args: {
    columns,
    rows: sampleData,
    keyField: 'id' as keyof User,
    onRowClick: (row: User) => {
      alert(`Clicked on ${row.name}`);
    },
  },
};

export const CustomFormatting: Story = {
  args: {
    columns: [
      {
        id: 'name',
        label: 'User',
        sortable: true,
        format: (value, row) => (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {value as string}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'role',
        label: 'Role & Department',
        format: (value, row) => (
          <Box>
            <Chip label={value as string} size="small" sx={{ mb: 0.5 }} />
            <Typography variant="caption" display="block" color="text.secondary">
              {row.department}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        format: (value) => {
          const status = value as User['status'];
          return <StatusChip status={status} />;
        },
      },
      {
        id: 'lastLogin',
        label: 'Last Active',
        sortable: true,
        format: (value) => {
          const date = new Date(value as string);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) return 'Today';
          if (diffDays === 1) return 'Yesterday';
          return `${diffDays} days ago`;
        },
      },
    ],
    rows: sampleData,
    keyField: 'id' as keyof User,
  },
};

export const WithToolbarActions: Story = {
  args: {
    columns,
    rows: sampleData,
    keyField: 'id' as keyof User,
    actions: (
      <Stack direction="row" spacing={2}>
        <Button variant="contained" size="small">
          Add User
        </Button>
        <Button variant="outlined" size="small">
          Export
        </Button>
      </Stack>
    ),
  },
};

export const CompactTable: Story = {
  args: {
    columns: columns.slice(0, 3),
    rows: sampleData.slice(0, 5),
    keyField: 'id' as keyof User,
  },
};

export const ErrorState: Story = {
  args: {
    columns,
    rows: [],
    keyField: 'id' as keyof User,
    error: 'Failed to load data. Please try again.',
  },
};
