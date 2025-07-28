import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

import { services } from '@/services';
import type { Cluster } from '@/types/cluster';
import type { UpdateOptions } from '@/services/cluster';

interface EditClusterDialogProps {
  open: boolean;
  cluster: Cluster | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ClusterFormData {
  name: string;
}

const EditClusterDialog: React.FC<EditClusterDialogProps> = ({
  open,
  cluster,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ClusterFormData>({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when cluster changes or dialog opens
  useEffect(() => {
    if (cluster && open) {
      setFormData({
        name: cluster.name,
      });
      setError(null);
    }
  }, [cluster, open]);

  const handleInputChange = (field: keyof ClusterFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleUpdate = async () => {
    if (!cluster) {
      setError('No cluster selected');
      return;
    }

    if (!formData.name.trim()) {
      setError('Cluster name is required');
      return;
    }

    if (formData.name === cluster.name) {
      // No changes made
      handleClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateOptions: UpdateOptions = {
        cluster: {
          name: formData.name,
        },
      };

      await services.cluster.update(cluster.id, updateOptions);
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Cluster update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cluster');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '' });
    setError(null);
    onClose();
  };

  const isNameValid = (name: string): boolean => {
    const nameRegex = /^[a-z0-9]([-_a-z0-9]*[a-z0-9])?$/;
    return name.length > 0 && name.length <= 255 && nameRegex.test(name);
  };

  const hasChanges = cluster && formData.name !== cluster.name;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Cluster</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Update the cluster name. The cluster ID cannot be changed.
          </Typography>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {cluster && (
            <>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Cluster ID
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {cluster.id}
                </Typography>
              </Box>

              <TextField
                label="Cluster Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                fullWidth
                required
                placeholder="my-cluster"
                helperText="Must be lowercase alphanumeric with optional hyphens or underscores"
                error={formData.name.length > 0 && !isNameValid(formData.name)}
                disabled={loading}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          disabled={loading || !isNameValid(formData.name) || !hasChanges}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Updating...' : 'Update Cluster'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditClusterDialog;
