import React, { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { services } from '@/services';
import type { Variable } from '@/types/variable';

interface EditVariableDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  variable: Variable | null;
}

const EditVariableDialog: React.FC<EditVariableDialogProps> = ({ open, onClose, onSuccess, variable }) => {
  const [editedVariable, setEditedVariable] = useState<{
    key: string;
    value: string;
    description?: string;
    isSensitive: boolean;
  }>({
    key: '',
    value: '',
    description: '',
    isSensitive: false,
  });
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (variable) {
      setEditedVariable({
        key: variable.key,
        value: variable.isSensitive ? '' : variable.value, // Don't show sensitive values
        description: variable.description || '',
        isSensitive: variable.isSensitive,
      });
    }
  }, [variable]);

  const handleVariableChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'is_sensitive' ? event.target.checked : event.target.value;
    setEditedVariable((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    setDialogError('');
    setSaving(false);
    onClose();
  };

  const handleSave = async () => {
    if (!variable) return;

    if (!editedVariable.key) {
      setDialogError('Key is required');
      return;
    }

    if (!editedVariable.value && !variable.isSensitive) {
      setDialogError('Value is required');
      return;
    }

    try {
      setSaving(true);

      await services.variable.update(variable.id, { variable: {
        key: editedVariable.key,
        value: editedVariable.value,
        description: editedVariable.description || undefined,
        isSensitive: variable.isSensitive,
      }});

      await onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating variable:', error);
      setDialogError(error instanceof Error ? error.message : 'Failed to update variable');
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          overflowX: 'hidden',
        },
      }}
    >
      <DialogTitle>Edit Variable</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Update the variable details.
        </DialogContentText>

        {dialogError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {dialogError}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Key"
            fullWidth
            value={editedVariable.key}
            onChange={handleVariableChange('key')}
            helperText="The variable name"
            disabled={saving}
          />

          <TextField
            label="Value"
            fullWidth
            value={editedVariable.value}
            onChange={handleVariableChange('value')}
            helperText={variable?.isSensitive ? "Leave empty to keep the current sensitive value" : "The variable value"}
            disabled={saving}
            type={editedVariable.isSensitive ? 'password' : 'text'}
          />

          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={editedVariable.description}
            onChange={handleVariableChange('description')}
            helperText="A brief description of what this variable is used for"
            disabled={saving}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditVariableDialog;
