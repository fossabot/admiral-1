import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Menu, CircularProgress, Alert,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { useVariableData } from '../hooks/use-variable-data';
import AddVariableDialog from './AddVariableDialog';
import EditVariableDialog from './EditVariableDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import type { Variable } from '@/types/variable';
import { services } from '@/services';

import styles from '../styles.module.scss';

const VariablesPage = () => {
  const { variables, fetchAllVariables, loading, error, isInitialized } = useVariableData();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);

  useEffect(() => {
    fetchAllVariables();
  }, [fetchAllVariables]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, variableId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedVariableId(variableId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVariableId(null);
  };

  const handleEdit = () => {
    if (selectedVariableId) {
      const variable = variables.find(v => v.id === selectedVariableId);
      if (variable) {
        setSelectedVariable(variable);
        setEditDialogOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedVariableId) {
      const variable = variables.find(v => v.id === selectedVariableId);
      if (variable) {
        setSelectedVariable(variable);
        setDeleteDialogOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleAddVariable = () => {
    setAddDialogOpen(true);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedVariable(null);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedVariable(null);
  };

  if (!isInitialized || loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Failed to load variables.</Alert>
      </Box>
    );
  }

  const sortedVariables = [...variables].sort((a, b) =>
    a.key.toLowerCase().localeCompare(b.key.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Organization variables
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add any number of variables for Admiral to use across all your applications.
      </Typography>

      <Button
        variant="contained"
        startIcon={<span>+</span>}
        onClick={handleAddVariable}
        sx={{ mb: 3 }}
      >
        Add variable
      </Button>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 'calc(50% - 40px)' }} />
            <col style={{ width: 'calc(50% - 40px)' }} />
            <col style={{ width: '80px' }} />
          </colgroup>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                <Typography fontWeight="bold">Key</Typography>
              </TableCell>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                <Typography fontWeight="bold">Value</Typography>
              </TableCell>
              <TableCell
                sx={{
                  textAlign: 'center',
                  width: '80px',
                }}
              >
                <Typography fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedVariables.length > 0 ? (
              sortedVariables.map((variable) => (
                <TableRow key={variable.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                    <Box>
                      <Typography variant="body1" component="div" sx={{ fontWeight: 500}}>
                        {variable.key}{' '}
                        {variable.isSensitive && (
                          <Chip label="Sensitive" size="small" color="secondary" variant="outlined" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      {variable.description && (
                        <Typography variant="body2" color="text.secondary">
                          {variable.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                    {variable.isSensitive ? (
                      <Typography fontStyle="italic">Sensitive - write only</Typography>
                    ) : variable.value}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton size="small" onClick={(event) => handleMenuOpen(event, variable.id)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3 }}>
                  No variables found. Add a variable to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              overflowX: 'hidden',
            },
          },
        }}
      >
        <MenuItem onClick={handleEdit} sx={{ color: '#1976d2' }}>
          Edit variable
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: '#d32f2f' }}>
          Delete
        </MenuItem>
      </Menu>
      <AddVariableDialog
        open={addDialogOpen}
        onClose={handleAddDialogClose}
        onSuccess={fetchAllVariables}
      />
      <EditVariableDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        onSuccess={fetchAllVariables}
        variable={selectedVariable}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onSuccess={fetchAllVariables}
        itemId={selectedVariable?.id || null}
        title="Delete Variable"
        message={selectedVariable ? `Are you sure you want to delete the variable "${selectedVariable.key}"? This action cannot be undone.` : ''}
        deleteFunction={services.variable.delete.bind(services.variable)}
      />
    </Box>
  );
};

export default VariablesPage;
