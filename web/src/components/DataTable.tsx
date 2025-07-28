import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  alpha,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { LoadingState } from './LoadingState.tsx';
import { EmptyState } from './EmptyState.tsx';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  numeric?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selected: T[]) => void;
  selectable?: boolean;
  actions?: React.ReactNode;
  emptyState?: {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  pagination?: {
    page: number;
    rowsPerPage: number;
    count: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsPerPageOptions?: number[];
  };
  sortable?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  sx?: object;
}

type Order = 'asc' | 'desc';

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  keyField,
  loading = false,
  error = null,
  onRowClick,
  onSelectionChange,
  selectable = false,
  actions,
  emptyState,
  pagination,
  sortable = true,
  stickyHeader = true,
  maxHeight,
  sx = {},
}: DataTableProps<T>) {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof T | string>('');
  const [selected, setSelected] = React.useState<T[keyof T][]>([]);

  const handleRequestSort = (property: keyof T | string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((row) => row[keyField]);
      setSelected(newSelected);
      onSelectionChange?.(rows);
      return;
    }
    setSelected([]);
    onSelectionChange?.([]);
  };

  const handleClick = (row: T) => {
    if (!selectable) {
      onRowClick?.(row);
      return;
    }

    const selectedIndex = selected.indexOf(row[keyField]);
    let newSelected: T[keyof T][] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, row[keyField]);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
    const selectedRows = rows.filter((r) => newSelected.includes(r[keyField]));
    onSelectionChange?.(selectedRows);
  };

  const isSelected = (id: T[keyof T]) => selected.indexOf(id) !== -1;

  const sortedRows = React.useMemo(() => {
    if (!orderBy || !sortable) return rows;

    return [...rows].sort((a, b) => {
      const orderByStr = String(orderBy);
      const aValue = orderByStr.includes('.')
        ? orderByStr.split('.').reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], a)
        : a[orderBy as keyof T];
      const bValue = orderByStr.includes('.')
        ? orderByStr.split('.').reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], b)
        : b[orderBy as keyof T];

      // Convert to strings for comparison
      const aStr = String(aValue ?? '');
      const bStr = String(bValue ?? '');

      if (bStr < aStr) {
        return order === 'desc' ? -1 : 1;
      }
      if (bStr > aStr) {
        return order === 'desc' ? 1 : -1;
      }
      return 0;
    });
  }, [rows, order, orderBy, sortable]);

  if (loading) {
    return <LoadingState message="Loading data..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading data"
        description={error}
        icon={<span>⚠️</span>}
      />
    );
  }

  if (rows.length === 0 && emptyState) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        icon={emptyState.icon}
        action={emptyState.action}
      />
    );
  }

  return (
    <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', border: '1px solid', borderColor: 'divider', ...sx }}>
      {selected.length > 0 && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(selected.length > 0 && {
              bgcolor: (theme) =>
                alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
            }),
          }}
        >
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {selected.length} selected
          </Typography>
          <Tooltip title="Delete">
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      )}

      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader={stickyHeader} aria-label="data table">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < rows.length}
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align || (column.numeric ? 'right' : 'left')}
                  style={{ width: column.width }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => {
              const isItemSelected = isSelected(row[keyField]);

              return (
                <TableRow
                  hover
                  onClick={() => handleClick(row)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={String(row[keyField])}
                  selected={isItemSelected}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const columnIdStr = String(column.id);
                    const value = columnIdStr.includes('.')
                      ? columnIdStr.split('.').reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], row)
                      : row[column.id as keyof T];

                    return (
                      <TableCell
                        key={column.id as string}
                        align={column.align || (column.numeric ? 'right' : 'left')}
                      >
                        {column.format ? column.format(value, row) : String(value ?? '')}
                      </TableCell>
                    );
                  })}
                  {actions && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {actions}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          rowsPerPageOptions={pagination.rowsPerPageOptions || [10, 25, 50, 100]}
          component="div"
          count={pagination.count}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={(_, page) => pagination.onPageChange(page)}
          onRowsPerPageChange={(e) => pagination.onRowsPerPageChange(parseInt(e.target.value, 10))}
        />
      )}
    </Paper>
  );
}
