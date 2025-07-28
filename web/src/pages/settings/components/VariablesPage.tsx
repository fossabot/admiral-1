import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Menu,
} from '@mui/material';
import { PageHeader, LoadingState, EmptyState, DataTable } from '@/components';
import type { Column } from '@/components';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { useVariableData } from '../hooks/use-variable-data';
import AddVariableDialog from './AddVariableDialog';
import EditVariableDialog from './EditVariableDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import type { Variable } from '@/types/variable';
import { services } from '@/services';


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
      const variable = variables.find((v) => v.id === selectedVariableId);
      if (variable) {
        setSelectedVariable(variable);
        setEditDialogOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedVariableId) {
      const variable = variables.find((v) => v.id === selectedVariableId);
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
    return <LoadingState message="Loading variables..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load variables"
        description="Something went wrong while loading your variables. Please try again."
      />
    );
  }

  const sortedVariables = [...variables].sort((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase()));

  const columns: Column<Variable>[] = [
    {
      id: 'key',
      label: 'Key',
      format: (_, variable) => (
        <Box>
          <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
            {variable.key}{' '}
            {variable.isSensitive && (
              <Chip label="Sensitive" size="small" color="secondary" variant="outlined" sx={{ ml: 1 }} />
            )}
          </Typography>
          {variable.description && (
            <Typography variant="caption" color="text.secondary">
              {variable.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'value',
      label: 'Value',
      format: (_, variable) => (
        <Typography variant="body2" fontStyle={variable.isSensitive ? 'italic' : 'normal'}>
          {variable.isSensitive ? 'Sensitive - write only' : variable.value}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      format: (_, variable) => (
        <IconButton size="small" onClick={(event) => handleMenuOpen(event, variable.id)}>
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Organization variables"
        description="Add any number of variables for Admiral to use across all your applications."
        actions={
          <Button variant="contained" startIcon={<span>+</span>} onClick={handleAddVariable}>
            Add variable
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={sortedVariables}
        keyField="id"
        loading={!isInitialized || loading}
        error={error ? 'Failed to load variables' : null}
        emptyState={{
          title: 'No variables found',
          description: 'Add a variable to get started.',
        }}
      />
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
      <AddVariableDialog open={addDialogOpen} onClose={handleAddDialogClose} onSuccess={fetchAllVariables} />
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
        message={
          selectedVariable
            ? `Are you sure you want to delete the variable "${selectedVariable.key}"? This action cannot be undone.`
            : ''
        }
        deleteFunction={services.variable.delete.bind(services.variable)}
      />
    </Box>
  );
};

export default VariablesPage;
