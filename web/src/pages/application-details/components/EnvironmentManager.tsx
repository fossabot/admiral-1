import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Launch as DeployIcon,
  Settings as SettingsIcon,
  CloudQueue as CloudIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';

import type { Application } from '@/types/application';
import type { Environment } from '@/types/environment';

interface EnvironmentManagerProps {
  application: Application;
  environments: Environment[];
  selectedEnvironment: Environment | null;
  onEnvironmentChange: (environment: Environment | null) => void;
  onRefresh: () => void;
}

interface CreateEnvironmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; namespace: string; clusterId?: string }) => void;
  creating: boolean;
  error: string | null;
}

// Mock environment health data
const generateEnvironmentHealth = () => ({
  status: Math.random() > 0.7 ? 'healthy' : Math.random() > 0.4 ? 'warning' : 'error',
  cpu: Math.random() * 100,
  memory: Math.random() * 100,
  instances: Math.floor(Math.random() * 10) + 1,
  uptime: Math.random() * 30,
  lastDeployment: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  version: `v1.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`,
});

const StatusIcon: React.FC<{ status: string; size?: 'small' | 'medium' }> = ({ status, size = 'medium' }) => {
  const icons = {
    healthy: <SuccessIcon sx={{ color: 'success.main' }} fontSize={size} />,
    warning: <WarningIcon sx={{ color: 'warning.main' }} fontSize={size} />,
    error: <ErrorIcon sx={{ color: 'error.main' }} fontSize={size} />,
    pending: <PendingIcon sx={{ color: 'info.main' }} fontSize={size} />,
  };

  return icons[status as keyof typeof icons] || icons.pending;
};

const CreateEnvironmentDialog: React.FC<CreateEnvironmentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  creating,
  error,
}) => {
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [clusterId, setClusterId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      namespace: namespace.trim() || name.trim().toLowerCase(),
      clusterId: clusterId.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!creating) {
      setName('');
      setNamespace('');
      setClusterId('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Environment</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Environment Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              required
              fullWidth
              helperText="e.g., development, staging, production"
            />

            <TextField
              label="Kubernetes Namespace"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              disabled={creating}
              fullWidth
              placeholder={name ? name.toLowerCase() : ''}
              helperText="Leave empty to use environment name"
            />

            <TextField
              label="Cluster ID (Optional)"
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              disabled={creating}
              fullWidth
              helperText="Target Kubernetes cluster for this environment"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={creating || !name.trim()}
          >
            {creating ? 'Creating...' : 'Create Environment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const EnvironmentCard: React.FC<{
  environment: Environment;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeploy: () => void;
}> = ({ environment, isSelected, onSelect, onEdit, onDelete, onDeploy }) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const health = generateEnvironmentHealth();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  return (
    <Card
      elevation={isSelected ? 4 : 1}
      sx={{
        cursor: 'pointer',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          elevation: 3,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={onSelect}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: `${getStatusColor(health.status)}.lighter`,
                color: `${getStatusColor(health.status)}.main`,
                width: 40,
                height: 40,
              }}
            >
              <CloudIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {environment.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {environment.namespace || 'default'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<StatusIcon status={health.status} size="small" />}
              label={health.status}
              size="small"
              color={getStatusColor(health.status) as 'success' | 'warning' | 'error' | 'info'}
              variant="outlined"
            />
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Metrics */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              CPU Usage
            </Typography>
            <LinearProgress
              variant="determinate"
              value={health.cpu}
              sx={{
                height: 6,
                borderRadius: 3,
                mt: 0.5,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: health.cpu > 80 ? 'error.main' : health.cpu > 60 ? 'warning.main' : 'success.main',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {health.cpu.toFixed(0)}%
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Memory Usage
            </Typography>
            <LinearProgress
              variant="determinate"
              value={health.memory}
              sx={{
                height: 6,
                borderRadius: 3,
                mt: 0.5,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: health.memory > 80 ? 'error.main' : health.memory > 60 ? 'warning.main' : 'success.main',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {health.memory.toFixed(0)}%
            </Typography>
          </Box>
        </Box>

        {/* Details */}
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Version:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {health.version}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Instances:
            </Typography>
            <Typography variant="body2">
              {health.instances}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Last Deploy:
            </Typography>
            <Typography variant="body2">
              {health.lastDeployment.toLocaleDateString()}
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        <MenuItem onClick={() => { onDeploy(); handleMenuClose(); }}>
          <ListItemIcon><DeployIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Deploy" />
        </MenuItem>
        <MenuItem onClick={() => { onEdit(); handleMenuClose(); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Configure" />
        </MenuItem>
        <MenuItem onClick={() => { onEdit(); handleMenuClose(); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { onDelete(); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </Card>
  );
};

const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({
  environments,
  selectedEnvironment,
  onEnvironmentChange,
  onRefresh,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateEnvironment = async (data: { name: string; namespace: string; clusterId?: string }) => {
    setCreating(true);
    setCreateError(null);

    try {
      // TODO: Call environment service to create
      // await services.environment.create({
      //   applicationId: application.id,
      //   ...data,
      // });

      console.log('Creating environment:', data);

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCreateDialogOpen(false);
      onRefresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create environment');
    } finally {
      setCreating(false);
    }
  };

  const handleEditEnvironment = (environment: Environment) => {
    // TODO: Open edit dialog
    console.log('Edit environment:', environment);
  };

  const handleDeleteEnvironment = (environment: Environment) => {
    // TODO: Open delete confirmation
    console.log('Delete environment:', environment);
  };

  const handleDeployEnvironment = (environment: Environment) => {
    // TODO: Navigate to deployment page or open deploy dialog
    console.log('Deploy to environment:', environment);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Environments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Environment
        </Button>
      </Box>

      {/* Environment Summary */}
      {environments.length > 0 && (
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Environment Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {environments.filter(() => Math.random() > 0.3).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Healthy
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {environments.filter(() => Math.random() > 0.7).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Warning
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {environments.filter(() => Math.random() > 0.9).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Environment Cards */}
      {environments.length > 0 ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {environments.map((environment) => (
            <EnvironmentCard
              key={environment.id}
              environment={environment}
              isSelected={selectedEnvironment?.id === environment.id}
              onSelect={() => onEnvironmentChange(environment)}
              onEdit={() => handleEditEnvironment(environment)}
              onDelete={() => handleDeleteEnvironment(environment)}
              onDeploy={() => handleDeployEnvironment(environment)}
            />
          ))}
        </Box>
      ) : (
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CloudIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Environments Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first environment to start deploying your application.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Environment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Environment Dialog */}
      <CreateEnvironmentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateEnvironment}
        creating={creating}
        error={createError}
      />
    </Box>
  );
};

export default EnvironmentManager;
