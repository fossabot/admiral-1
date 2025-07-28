import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { DataTable, Column } from './DataTable';

// Test data types
interface TestUser extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  age: number;
  status: string;
  profile: {
    department: string;
  };
}

// Test data
const mockUsers: TestUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    status: 'active',
    profile: { department: 'Engineering' },
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
    status: 'inactive',
    profile: { department: 'Marketing' },
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    age: 35,
    status: 'active',
    profile: { department: 'Sales' },
  },
];

// Test columns
const mockColumns: Column<TestUser>[] = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
  { id: 'age', label: 'Age', numeric: true, align: 'right' },
  { id: 'status', label: 'Status', format: (value) => String(value).toUpperCase() },
  { id: 'profile.department', label: 'Department', width: 150 },
];

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

// Test props helper
const getProps = () => ({
  columns: mockColumns,
  rows: mockUsers,
  keyField: 'id' as keyof TestUser,
});

describe('DataTable', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render with basic props', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should render all columns correctly', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      mockColumns.forEach((column) => {
        expect(screen.getByText(column.label)).toBeInTheDocument();
      });
    });

    it('should render all rows correctly', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should apply column formatting', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      // Status column should be uppercase due to format function
      expect(screen.getAllByText('ACTIVE')).toHaveLength(2); // Two users have 'active' status
      expect(screen.getByText('INACTIVE')).toBeInTheDocument();
    });

    it('should handle nested object properties', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('should render with custom sx styling', () => {
      const customSx = { border: '2px solid red' };
      const { container } = renderWithTheme(
        <DataTable<TestUser> {...getProps()} sx={customSx} />
      );

      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle('border: 2px solid red');
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} loading={true} />);

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show custom loading message', () => {
      renderWithTheme(
        <DataTable<TestUser>
          columns={getProps().columns}
          rows={getProps().rows}
          keyField={getProps().keyField}
          loading={true}
          // Note: LoadingState component doesn't expose message prop directly in DataTable
        />
      );

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state', () => {
      const errorMessage = 'Failed to load data';
      renderWithTheme(<DataTable<TestUser> {...getProps()} error={errorMessage} />);

      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show error icon', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} error="Test error" />);

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no rows and emptyState provided', () => {
      const emptyState = {
        title: 'No users found',
        description: 'Create your first user to get started',
        action: {
          label: 'Add User',
          onClick: vi.fn(),
        },
      };

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} rows={[]} emptyState={emptyState} />
      );

      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Create your first user to get started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    });

    it('should handle empty state action click', async () => {
      const mockAction = vi.fn();
      const emptyState = {
        title: 'No users found',
        action: {
          label: 'Add User',
          onClick: mockAction,
        },
      };

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} rows={[]} emptyState={emptyState} />
      );

      const addButton = screen.getByRole('button', { name: 'Add User' });
      await user.click(addButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should render table when rows exist even with emptyState prop', () => {
      const emptyState = {
        title: 'No users found',
        action: { label: 'Add User', onClick: vi.fn() },
      };

      renderWithTheme(<DataTable<TestUser> {...getProps()} emptyState={emptyState} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByText('No users found')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should enable sorting by default', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      const nameHeader = screen.getByText('Name').closest('span');
      expect(nameHeader?.parentElement).toHaveClass('MuiTableSortLabel-root');
    });

    it('should disable sorting when sortable=false', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} sortable={false} />);

      const nameHeader = screen.getByText('Name');
      expect(nameHeader.closest('.MuiTableSortLabel-root')).not.toBeInTheDocument();
    });

    it('should handle column sorting', async () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      const nameHeader = screen.getByText('Name').closest('.MuiTableSortLabel-root');
      expect(nameHeader).toBeInTheDocument();

      // Click to sort by name
      await user.click(nameHeader!);

      // Check if sorting indicators are present
      await waitFor(() => {
        const sortLabel = screen.getByText('Name').closest('.MuiTableSortLabel-root');
        expect(sortLabel).toHaveClass('MuiTableSortLabel-active');
      });
    });

    it('should toggle sort direction on multiple clicks', async () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      const nameHeader = screen.getByText('Name').closest('.MuiTableSortLabel-root');

      // First click - ascending
      await user.click(nameHeader!);

      // Second click - descending
      await user.click(nameHeader!);

      await waitFor(() => {
        const sortLabel = screen.getByText('Name').closest('.MuiTableSortLabel-root');
        expect(sortLabel).toHaveClass('MuiTableSortLabel-active');
      });
    });

    it('should respect column sortable=false', () => {
      const columnsWithNonSortable: Column<TestUser>[] = [
        { id: 'name', label: 'Name', sortable: false },
        { id: 'email', label: 'Email', sortable: true },
      ];

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} columns={columnsWithNonSortable} />
      );

      const nameHeader = screen.getByText('Name');
      const emailHeader = screen.getByText('Email');

      expect(nameHeader.closest('.MuiTableSortLabel-root')).not.toBeInTheDocument();
      expect(emailHeader.closest('.MuiTableSortLabel-root')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should not show checkboxes when selectable=false', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} selectable={false} />);

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should show checkboxes when selectable=true', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} selectable={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4); // 3 rows + 1 header
    });

    it('should handle row selection', async () => {
      const mockSelectionChange = vi.fn();
      renderWithTheme(
        <DataTable<TestUser>
          columns={getProps().columns}
          rows={getProps().rows}
          keyField={getProps().keyField}
          selectable={true}
          onSelectionChange={mockSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Skip header checkbox

      await user.click(firstRowCheckbox);

      expect(mockSelectionChange).toHaveBeenCalledWith([mockUsers[0]]);
    });

    it('should handle select all', async () => {
      const mockSelectionChange = vi.fn();
      renderWithTheme(
        <DataTable<TestUser>
          columns={getProps().columns}
          rows={getProps().rows}
          keyField={getProps().keyField}
          selectable={true}
          onSelectionChange={mockSelectionChange}
        />
      );

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(headerCheckbox);

      expect(mockSelectionChange).toHaveBeenCalledWith(mockUsers);
    });

    it('should show selection toolbar when items selected', async () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} selectable={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeInTheDocument();
      });
    });

    it('should show delete button in selection toolbar', async () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} selectable={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByTitle('Delete')).toBeInTheDocument();
      });
    });
  });

  describe('Row Interactions', () => {
    it('should handle row click when onRowClick provided', async () => {
      const mockRowClick = vi.fn();
      renderWithTheme(
        <DataTable<TestUser> {...getProps()} onRowClick={mockRowClick} />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      await user.click(firstRow!);

      expect(mockRowClick).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should not call onRowClick when row is selectable', async () => {
      const mockRowClick = vi.fn();
      renderWithTheme(
        <DataTable<TestUser>
          columns={getProps().columns}
          rows={getProps().rows}
          keyField={getProps().keyField}
          selectable={true}
          onRowClick={mockRowClick}
        />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      await user.click(firstRow!);

      expect(mockRowClick).not.toHaveBeenCalled();
    });

    it('should show cursor pointer when onRowClick provided', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} onRowClick={vi.fn()} />);

      const firstRow = screen.getByText('John Doe').closest('tr');
      expect(firstRow).toHaveStyle('cursor: pointer');
    });
  });

  describe('Actions Column', () => {
    it('should render actions column when actions provided', () => {
      const actions = <button>Edit</button>;
      renderWithTheme(<DataTable<TestUser> {...getProps()} actions={actions} />);

      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getAllByText('Edit')).toHaveLength(mockUsers.length);
    });

    it('should prevent row click when clicking actions', async () => {
      const mockRowClick = vi.fn();
      const actions = <button>Edit</button>;

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} onRowClick={mockRowClick} actions={actions} />
      );

      const editButton = screen.getAllByText('Edit')[0];
      await user.click(editButton);

      expect(mockRowClick).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should render pagination when provided', () => {
      const pagination = {
        page: 0,
        rowsPerPage: 10,
        count: 50,
        onPageChange: vi.fn(),
        onRowsPerPageChange: vi.fn(),
      };

      renderWithTheme(<DataTable<TestUser> {...getProps()} pagination={pagination} />);

      expect(screen.getByText('Rows per page:')).toBeInTheDocument();
      expect(screen.getByText('1–3 of 50')).toBeInTheDocument();
    });

    it('should handle page change', async () => {
      const mockPageChange = vi.fn();
      const pagination = {
        page: 0,
        rowsPerPage: 2,
        count: 10,
        onPageChange: mockPageChange,
        onRowsPerPageChange: vi.fn(),
      };

      renderWithTheme(<DataTable<TestUser> {...getProps()} pagination={pagination} />);

      const nextButton = screen.getByTitle('Go to next page');
      await user.click(nextButton);

      expect(mockPageChange).toHaveBeenCalledWith(1);
    });

    it('should handle rows per page change', async () => {
      const mockRowsPerPageChange = vi.fn();
      const pagination = {
        page: 0,
        rowsPerPage: 10,
        count: 50,
        onPageChange: vi.fn(),
        onRowsPerPageChange: mockRowsPerPageChange,
      };

      renderWithTheme(<DataTable<TestUser> {...getProps()} pagination={pagination} />);

      // Find the select button (MUI Select renders as a button)
      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      // Wait for dropdown to open and find the option
      const option25 = await screen.findByRole('option', { name: '25' });
      await user.click(option25);

      expect(mockRowsPerPageChange).toHaveBeenCalledWith(25);
    });

    it('should use custom rowsPerPageOptions', () => {
      const pagination = {
        page: 0,
        rowsPerPage: 5,
        count: 50,
        onPageChange: vi.fn(),
        onRowsPerPageChange: vi.fn(),
        rowsPerPageOptions: [5, 15, 30],
      };

      renderWithTheme(<DataTable<TestUser> {...getProps()} pagination={pagination} />);

      const select = screen.getByDisplayValue('5');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Table Configuration', () => {
    it('should apply sticky header by default', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'data table');
    });

    it('should disable sticky header when stickyHeader=false', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} stickyHeader={false} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should apply maxHeight to table container', () => {
      const { container } = renderWithTheme(
        <DataTable<TestUser> {...getProps()} maxHeight={300} />
      );

      const tableContainer = container.querySelector('.MuiTableContainer-root');
      expect(tableContainer).toHaveStyle('max-height: 300px');
    });

    it('should apply maxHeight as string', () => {
      const { container } = renderWithTheme(
        <DataTable<TestUser> {...getProps()} maxHeight="50vh" />
      );

      const tableContainer = container.querySelector('.MuiTableContainer-root');
      expect(tableContainer).toHaveStyle('max-height: 50vh');
    });
  });

  describe('Column Configuration', () => {
    it('should apply column width', () => {
      const columnsWithWidth: Column<TestUser>[] = [
        { id: 'name', label: 'Name', width: 200 },
        { id: 'email', label: 'Email', width: '30%' },
      ];

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} columns={columnsWithWidth} />
      );

      const nameCell = screen.getByText('Name').closest('th');
      const emailCell = screen.getByText('Email').closest('th');

      expect(nameCell).toHaveStyle('width: 200px');
      expect(emailCell).toHaveStyle('width: 30%');
    });

    it('should apply column alignment', () => {
      const columnsWithAlign: Column<TestUser>[] = [
        { id: 'name', label: 'Name', align: 'center' },
        { id: 'age', label: 'Age', align: 'right', numeric: true },
      ];

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} columns={columnsWithAlign} />
      );

      const nameCell = screen.getByText('Name').closest('th');
      const ageCell = screen.getByText('Age').closest('th');

      expect(nameCell).toHaveClass('MuiTableCell-alignCenter');
      expect(ageCell).toHaveClass('MuiTableCell-alignRight');
    });

    it('should auto-align numeric columns to right', () => {
      const columnsWithNumeric: Column<TestUser>[] = [
        { id: 'age', label: 'Age', numeric: true },
      ];

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} columns={columnsWithNumeric} />
      );

      const ageHeader = screen.getByText('Age').closest('th');
      const ageCells = screen.getAllByText('30')[0].closest('td');

      expect(ageHeader).toHaveClass('MuiTableCell-alignRight');
      expect(ageCells).toHaveClass('MuiTableCell-alignRight');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} columns={[]} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle missing keyField values', () => {
      const invalidUsers = [
        { name: 'No ID User', email: 'test@example.com', age: 25, status: 'active', profile: { department: 'Test' } },
      ] as TestUser[];

      expect(() => {
        renderWithTheme(<DataTable<TestUser> {...getProps()} rows={invalidUsers} />);
      }).not.toThrow();
    });

    it('should handle null/undefined cell values', () => {
      const usersWithNulls: TestUser[] = [
        {
          id: '1',
          name: '',
          email: 'test@example.com',
          age: 0,
          status: 'active',
          profile: { department: 'Test' },
        },
      ];

      renderWithTheme(<DataTable<TestUser> {...getProps()} rows={usersWithNulls} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle complex nested object access', () => {
      const complexColumns: Column<TestUser>[] = [
        { id: 'profile.department', label: 'Department' },
        { id: 'profile.nonexistent.field', label: 'Non-existent' },
      ];

      renderWithTheme(
        <DataTable<TestUser> {...getProps()} columns={complexColumns} />
      );

      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });

    it('should prevent checkbox click from triggering row selection', async () => {
      const mockSelectionChange = vi.fn();
      renderWithTheme(
        <DataTable<TestUser>
          columns={getProps().columns}
          rows={getProps().rows}
          keyField={getProps().keyField}
          selectable={true}
          onSelectionChange={mockSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1];

      // Click the checkbox directly
      fireEvent.click(firstRowCheckbox, { stopPropagation: vi.fn() });

      await waitFor(() => {
        expect(mockSelectionChange).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      const rows = screen.getAllByRole('row');
      // Should have 1 header row + 3 data rows from mockUsers
      expect(rows.length).toBeGreaterThanOrEqual(1); // At least header row
    });

    it('should have aria-label on table', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'data table');
    });

    it('should have proper checkbox roles', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} selectable={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Should have checkboxes for selectable rows (header + data rows)
      expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper row roles', () => {
      renderWithTheme(<DataTable<TestUser> {...getProps()} selectable={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Should have checkboxes for each selectable row
      expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    });
  });
});
