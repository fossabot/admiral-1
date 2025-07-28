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
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';

import { services } from '@/services';
import type { Cluster } from '@/types/cluster';

interface ResetTokenDialogProps {
  open: boolean;
  cluster: Cluster | null;
  onClose: () => void;
}

const ResetTokenDialog: React.FC<ResetTokenDialogProps> = ({ open, cluster, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleResetToken = async () => {
    if (!cluster) return;

    setLoading(true);
    setError(null);

    try {
      const token = await services.cluster.resetToken(cluster.id);
      setNewToken(token);
    } catch (err) {
      console.error('Token reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset token');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (newToken) {
      try {
        await navigator.clipboard.writeText(newToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  };

  const handleClose = () => {
    setLoading(false);
    setError(null);
    setNewToken(null);
    setCopied(false);
    onClose();
  };

  if (newToken) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon color="success" />
            Token Reset Successfully
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Alert severity="success">A new access token has been generated for cluster "{cluster?.name}".</Alert>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                New Access Token
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Save this token securely. The previous token is now invalid.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: 'grey.50',
                  border: '1px dashed',
                  borderColor: 'primary.main',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{
                    wordBreak: 'break-all',
                    pr: 5,
                  }}
                >
                  {newToken}
                </Typography>

                <IconButton
                  onClick={handleCopyToken}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}
                  color={copied ? 'success' : 'primary'}
                >
                  {copied ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
              </Paper>

              {copied && <Chip label="Token copied!" color="success" size="small" sx={{ mt: 1 }} />}
            </Box>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> This token will only be displayed once. Make sure to copy and store it
                securely before closing this dialog. The previous token is now invalid and any systems using it will
                need to be updated.
              </Typography>
            </Alert>
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
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          Reset Cluster Token
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to reset the access token for cluster "{cluster?.name}"?
          </Typography>

          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Warning:</strong> This action will invalidate the current token. Any systems or applications using
              the current token will lose access until they are updated with the new token.
            </Typography>
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleResetToken}
          variant="contained"
          color="warning"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Resetting...' : 'Reset Token'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResetTokenDialog;
