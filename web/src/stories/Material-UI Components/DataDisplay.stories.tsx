import type { Meta, StoryObj } from '@storybook/react-vite';
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
  Pagination,
  Tooltip,
  Paper,
  Box,
  Typography,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Checkbox,
  Button,
} from '@mui/material';
import {
  Info,
  Help,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';

const meta: Meta = {
  title: 'Material-UI Components/Data Display',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Data display components styled with the Admiral Design System theme.',
      },
    },
  },
};

export default meta;

// Sample data for tables
const createData = (
  name: string,
  status: string,
  email: string,
  role: string,
  lastLogin: string,
) => {
  return { name, status, email, role, lastLogin };
};

const rows = [
  createData('John Doe', 'Active', 'john.doe@example.com', 'Admin', '2024-03-15'),
  createData('Jane Smith', 'Active', 'jane.smith@example.com', 'User', '2024-03-14'),
  createData('Bob Johnson', 'Inactive', 'bob.johnson@example.com', 'User', '2024-03-10'),
  createData('Alice Brown', 'Active', 'alice.brown@example.com', 'Moderator', '2024-03-15'),
  createData('Charlie Davis', 'Pending', 'charlie.davis@example.com', 'User', '2024-03-12'),
];

export const BasicTable: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Simple Table</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Last Login</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={
                        row.status === 'Active' ? 'success' :
                        row.status === 'Inactive' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{row.lastLogin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Dense Table</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(0, 3).map((row, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={
                        row.status === 'Active' ? 'success' :
                        row.status === 'Inactive' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  ),
};

export const SortableTable: StoryObj = {
  render: () => {
    const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = React.useState<string>('name');

    const handleRequestSort = (property: string) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };

    const sortedRows = React.useMemo(() => {
      return [...rows].sort((a, b) => {
        const aValue = a[orderBy as keyof typeof a];
        const bValue = b[orderBy as keyof typeof b];

        if (order === 'desc') {
          return bValue < aValue ? -1 : 1;
        }
        return aValue < bValue ? -1 : 1;
      });
    }, [order, orderBy]);

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Sortable Table</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleRequestSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'email'}
                    direction={orderBy === 'email' ? order : 'asc'}
                    onClick={() => handleRequestSort('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'role'}
                    direction={orderBy === 'role' ? order : 'asc'}
                    onClick={() => handleRequestSort('role')}
                  >
                    Role
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {row.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      {row.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={
                        row.status === 'Active' ? 'success' :
                        row.status === 'Inactive' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Chip label={row.role} variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  },
};

export const SelectableTable: StoryObj = {
  render: () => {
    const [selected, setSelected] = React.useState<number[]>([]);

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        const newSelected = rows.map((_, index) => index);
        setSelected(newSelected);
        return;
      }
      setSelected([]);
    };

    const handleClick = (index: number) => {
      const selectedIndex = selected.indexOf(index);
      let newSelected: number[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, index);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1),
        );
      }

      setSelected(newSelected);
    };

    const isSelected = (index: number) => selected.indexOf(index) !== -1;

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Selectable Table</Typography>
        {selected.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="body2">
              {selected.length} item(s) selected
            </Typography>
            <Button size="small" sx={{ mt: 1 }}>
              Delete Selected
            </Button>
          </Box>
        )}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < rows.length}
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                const isItemSelected = isSelected(index);

                return (
                  <TableRow
                    key={index}
                    hover
                    onClick={() => handleClick(index)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                      />
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={
                          row.status === 'Active' ? 'success' :
                          row.status === 'Inactive' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  },
};

export const TableWithPagination: StoryObj = {
  render: () => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(3);

    // Generate more sample data
    const allRows = Array.from({ length: 25 }, (_, i) =>
      createData(
        `User ${i + 1}`,
        ['Active', 'Inactive', 'Pending'][i % 3],
        `user${i + 1}@example.com`,
        ['Admin', 'User', 'Moderator'][i % 3],
        `2024-03-${(i % 28) + 1}`,
      )
    );

    const handleChangePage = (_event: unknown, newPage: number) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const displayedRows = allRows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Table with Pagination</Typography>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Last Login</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRows.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={
                          row.status === 'Active' ? 'success' :
                          row.status === 'Inactive' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.lastLogin}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[3, 5, 10, 25]}
            component="div"
            count={allRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    );
  },
};

export const PaginationComponent: StoryObj = {
  render: () => {
    const [page, setPage] = React.useState(1);
    const [page2, setPage2] = React.useState(1);

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Pagination</Typography>
          <Stack spacing={2} alignItems="center">
            <Pagination count={10} page={page} onChange={(_, value) => setPage(value)} />
            <Pagination count={10} color="primary" />
            <Pagination count={10} color="secondary" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Pagination Variants</Typography>
          <Stack spacing={2} alignItems="center">
            <Pagination count={10} variant="outlined" />
            <Pagination count={10} variant="outlined" color="secondary" />
            <Pagination count={10} variant="text" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Pagination Sizes</Typography>
          <Stack spacing={2} alignItems="center">
            <Pagination count={10} size="small" />
            <Pagination count={10} size="medium" />
            <Pagination count={10} size="large" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Pagination with Boundaries</Typography>
          <Stack spacing={2} alignItems="center">
            <Pagination count={20} page={page2} onChange={(_, value) => setPage2(value)} />
            <Pagination count={20} boundaryCount={2} />
            <Pagination count={20} siblingCount={2} />
            <Pagination count={20} showFirstButton showLastButton />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Disabled Pagination</Typography>
          <Pagination count={10} disabled />
        </Box>
      </Stack>
    );
  },
};

export const TooltipComponent: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Basic Tooltips</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Tooltip title="This is a tooltip">
            <Button>Hover me</Button>
          </Tooltip>
          <Tooltip title="Delete item" arrow>
            <IconButton>
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title="Get more information">
            <IconButton>
              <Info />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Tooltip Placements</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Tooltip title="Top" placement="top">
            <Button>Top</Button>
          </Tooltip>
          <Tooltip title="Right" placement="right">
            <Button>Right</Button>
          </Tooltip>
          <Tooltip title="Bottom" placement="bottom">
            <Button>Bottom</Button>
          </Tooltip>
          <Tooltip title="Left" placement="left">
            <Button>Left</Button>
          </Tooltip>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Rich Tooltips</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Tooltip
            title={
              <React.Fragment>
                <Typography color="inherit">Rich Tooltip</Typography>
                <em>{"This tooltip has multiple lines"}</em>
                <br />
                <strong>{"And formatting!"}</strong>
              </React.Fragment>
            }
          >
            <Button>Rich tooltip</Button>
          </Tooltip>

          <Tooltip
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2">User Information</Typography>
                <Typography variant="body2">John Doe</Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrator
                </Typography>
              </Box>
            }
          >
            <Avatar sx={{ cursor: 'pointer' }}>JD</Avatar>
          </Tooltip>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Rich Content Tooltips</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Tooltip title="This is a standard tooltip">
            <Button>Standard Tooltip</Button>
          </Tooltip>

          <Tooltip
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Tooltip with actions
                </Typography>
                <Button size="small" variant="outlined">
                  Action
                </Button>
              </Box>
            }
          >
            <Button>Rich Content</Button>
          </Tooltip>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Disabled Elements</Typography>
        <Tooltip title="You can't click this button">
          <span>
            <Button disabled>Disabled Button</Button>
          </span>
        </Tooltip>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Custom Styled Tooltips</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Tooltip
            title="Custom styled tooltip"
            arrow
            sx={{
              '& .MuiTooltip-tooltip': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.75rem',
              },
              '& .MuiTooltip-arrow': {
                color: 'primary.main',
              },
            }}
          >
            <Button>Primary Style</Button>
          </Tooltip>

          <Tooltip
            title="Warning tooltip"
            arrow
            sx={{
              '& .MuiTooltip-tooltip': {
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
              },
              '& .MuiTooltip-arrow': {
                color: 'warning.main',
              },
            }}
          >
            <IconButton>
              <Help />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Stack>
  ),
};
