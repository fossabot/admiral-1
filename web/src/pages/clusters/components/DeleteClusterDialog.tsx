import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

import { services } from '@/services';
import type { Cluster } from '@/types/cluster';

interface DeleteClusterDialogProps {
  open: boolean;
  cluster: Cluster | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteClusterDialog: React.FC<DeleteClusterDialogProps> = ({
  open,
  cluster,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    if (!cluster) return;

    setLoading(true);
    setError(null);

    try {
      await services.cluster.delete(cluster.id);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Cluster deletion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete cluster');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLoading(false);
    setError(null);
    setConfirmationText('');
    onClose();
  };

  const isConfirmationValid = confirmationText === cluster?.name;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="error" />
          Delete Cluster
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to delete cluster "{cluster?.name}"?
          </Typography>

          <Alert severity="error">
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. Deleting this cluster will:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Permanently remove the cluster from Admiral</li>
              <li>Invalidate the cluster's access token</li>
              <li>Remove all associated deployments and configurations</li>
            </Box>
          </Alert>

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              To confirm deletion, type the cluster name <strong>{cluster?.name}</strong> below:
            </Typography>
            <TextField
              fullWidth
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={cluster?.name}
              disabled={loading}
              size="small"
            />
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading || !isConfirmationValid}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Deleting...' : 'Delete Cluster'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteClusterDialog;
