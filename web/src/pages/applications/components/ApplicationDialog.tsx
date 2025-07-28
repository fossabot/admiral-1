import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';

type ApplicationDialogProps = {
  open: boolean;
  onClose: () => void;
  createError: string | null;
  newName: string;
  setNewName: (value: string) => void;
  newDesc: string;
  setNewDesc: (value: string) => void;
  creating: boolean;
  handleCreate: () => void;
};

const ApplicationDialog: React.FC<ApplicationDialogProps> = ({
  open,
  onClose,
  createError,
  newName,
  setNewName,
  newDesc,
  setNewDesc,
  creating,
  handleCreate,
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus name input when dialog opens
  useEffect(() => {
    if (open && nameInputRef.current) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey && newName.trim() && !creating) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleClose = () => {
    if (!creating) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Create Application</DialogTitle>

      <DialogContent>
        {createError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {createError}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }} onKeyDown={handleKeyDown}>
          <TextField
            inputRef={nameInputRef}
            autoFocus
            label="Application Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={creating}
            error={!newName.trim() && newName.length > 0}
            helperText={!newName.trim() && newName.length > 0 ? 'Application name is required' : ''}
          />

          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            disabled={creating}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          variant="contained"
          startIcon={creating ? <CircularProgress size={16} /> : null}
        >
          {creating ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationDialog;
