import React from 'react';
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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            overflowX: 'hidden',
          },
        },
      }}
    >
      <DialogTitle sx={{ typography: 'h4', fontWeight: 'bold' }}>Add new application</DialogTitle>
      <DialogContent dividers sx={{ overflowX: 'hidden' }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField
            label="Name"
            required
            fullWidth
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            error={Boolean(createError)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={creating}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={!newName.trim() || creating}>
          {creating ? <CircularProgress size={20} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationDialog;
