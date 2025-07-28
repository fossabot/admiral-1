import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

import { services } from '@/services';
import type { CreateOptions, CreateResponse } from '@/services/cluster';

interface CreateClusterDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ClusterFormData {
  name: string;
  metadata: Record<string, string>;
}

const CreateClusterDialog: React.FC<CreateClusterDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ClusterFormData>({
    name: '',
    metadata: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<CreateResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus copy button when token is displayed
  useEffect(() => {
    if (successData && copyButtonRef.current) {
      copyButtonRef.current.focus();
    }
  }, [successData]);

  const handleInputChange = (field: keyof ClusterFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Cluster name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const createOptions: CreateOptions = {
        name: formData.name,
        metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined,
      };

      const result = await services.cluster.createWithToken(createOptions);
      setSuccessData(result);
      // Don't call onSuccess here - wait until user closes the dialog
    } catch (err) {
      console.error('Cluster creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create cluster');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (successData?.accessToken) {
      try {
        await navigator.clipboard.writeText(successData.accessToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Failed to copy token:', err);
        // Fallback for browsers that don't support clipboard API
        try {
          const textArea = document.createElement('textarea');
          textArea.value = successData.accessToken;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
        }
      }
    }
  };

  const handleClose = () => {
    // If we have success data, call onSuccess to refresh the cluster list
    if (successData) {
      onSuccess?.();
    }

    setFormData({ name: '', metadata: {} });
    setError(null);
    setSuccessData(null);
    setCopied(false);
    onClose();
  };

  const isNameValid = (name: string): boolean => {
    const nameRegex = /^[a-z0-9]([-_a-z0-9]*[a-z0-9])?$/;
    return name.length > 0 && name.length <= 255 && nameRegex.test(name);
  };

  if (successData) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon color="success" />
            Cluster Created Successfully
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Copy this token and provide it to the Admiral controller in your Kubernetes cluster to complete the registration process.
                </Typography>
              </Alert>

              <Typography variant="h5" gutterBottom color="textSecondary" sx={{ mt: 2 }}>
                🔐 Access Token
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  backgroundColor: 'grey.50',
                  border: '2px dashed',
                  borderColor: 'grey.400',
                  position: 'relative',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{
                    wordBreak: 'break-all',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    pr: 6,
                  }}
                >
                  {successData.accessToken}
                </Typography>

                <IconButton
                  onClick={handleCopyToken}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: copied ? 'success.main' : 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: copied ? 'success.dark' : 'primary.dark',
                    },
                  }}
                  size="small"
                >
                  {copied ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
              </Paper>

              <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
                <strong>Important:</strong> This token will only be shown once. Copy and save it securely before closing this dialog.
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  ref={copyButtonRef}
                  variant={copied ? "contained" : "outlined"}
                  size="small"
                  startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                  onClick={handleCopyToken}
                  sx={{
                    textTransform: 'none',
                    minWidth: '140px',
                    backgroundColor: copied ? 'success.main' : undefined,
                    borderColor: copied ? 'success.main' : undefined,
                    color: copied ? 'white' : undefined,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      backgroundColor: copied ? 'success.dark' : undefined,
                      borderColor: copied ? 'success.dark' : undefined,
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      void handleCopyToken();
                    }
                  }}
                >
                  {copied ? 'Token Copied!' : 'Copy Token'}
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Cluster</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Create a new cluster to connect your infrastructure to Admiral.
          </Typography>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={loading || !isNameValid(formData.name)}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Creating...' : 'Create Cluster'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateClusterDialog;
