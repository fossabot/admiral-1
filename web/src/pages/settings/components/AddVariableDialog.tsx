import React, { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material';

import { services } from '@/services';
import type { VariableCreateOptions } from '@/services/variable';

interface AddVariableDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const AddVariableDialog: React.FC<AddVariableDialogProps> = ({ open, onClose, onSuccess }) => {
  const [newVariable, setNewVariable] = useState<VariableCreateOptions & { description?: string }>({
    key: '',
    value: '',
    description: '',
    isSensitive: false,
  });
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleVariableChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'isSensitive' ? event.target.checked : event.target.value;
    setNewVariable((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setNewVariable({
      key: '',
      value: '',
      description: '',
      isSensitive: false,
    });
    setDialogError('');
    setSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!newVariable.key) {
      setDialogError('Key is required');
      return;
    }

    if (!newVariable.value) {
      setDialogError('Value is required');
      return;
    }

    try {
      setSaving(true);

      await services.variable.create({
        key: newVariable.key,
        value: newVariable.value,
        description: newVariable.description,
        isSensitive: newVariable.isSensitive,
      });

      await onSuccess();

      // Close the dialog
      handleClose();
    } catch (error) {
      console.error('Error creating variable:', error);
      setDialogError(error instanceof Error ? error.message : 'Failed to create variable');
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
      <DialogTitle>Add New Variable</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>Create a new variable to use across your applications.</DialogContentText>

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
            value={newVariable.key}
            onChange={handleVariableChange('key')}
            helperText="The variable name"
            disabled={saving}
          />

          <TextField
            label="Value"
            fullWidth
            value={newVariable.value}
            onChange={handleVariableChange('value')}
            helperText="The variable value"
            disabled={saving}
          />

          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={newVariable.description}
            onChange={handleVariableChange('description')}
            helperText="A brief description of what this variable is used for"
            disabled={saving}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={newVariable.isSensitive}
                onChange={handleVariableChange('isSensitive')}
                disabled={saving}
              />
            }
            label="Sensitive (value will be masked in the UI)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add Variable'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVariableDialog;
