import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  Tabs,
  Tab,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Description as ManifestIcon,
  CloudQueue as K8sIcon,
  Storage as VolumeIcon,
  NetworkCheck as ServiceIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { Application } from '@/types/application';
import type { Environment } from '@/types/environment';
import type { Manifest } from '@/types/manifest';

interface ManifestManagerProps {
  application: Application;
  environments: Environment[];
  manifests: Manifest[];
  selectedEnvironment: Environment | null;
  onEnvironmentChange: (environment: Environment | null) => void;
  onRefresh: () => void;
}

interface ManifestWithParsed extends Manifest {
  content: string; // Computed from file.fileContent
  parsed?: Record<string, unknown>;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface ManifestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    content: string;
    environmentId?: string;
  }) => void;
  manifest?: ManifestWithParsed | null;
  creating: boolean;
  error: string | null;
  environments: Environment[];
  selectedEnvironment: Environment | null;
}

// Mock YAML parsing and validation
const parseYaml = (content: string) => {
  try {
    // In real app, use yaml.parse(content)
    const mockParsed = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'sample-app' },
      spec: { replicas: 3 },
    };

    return {
      parsed: mockParsed,
      validation: {
        isValid: !content.includes('error'),
        errors: content.includes('error') ? ['Invalid YAML syntax'] : [],
        warnings: content.includes('warn') ? ['Consider using latest image tag'] : [],
      },
    };
  } catch (error) {
    return {
      parsed: null,
      validation: {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Parse error'],
        warnings: [],
      },
    };
  }
};

const getManifestType = (content: string) => {
  if (content.includes('kind: Deployment')) return 'deployment';
  if (content.includes('kind: Service')) return 'service';
  if (content.includes('kind: ConfigMap')) return 'configmap';
  if (content.includes('kind: Secret')) return 'secret';
  if (content.includes('kind: Ingress')) return 'ingress';
  return 'unknown';
};

const getManifestIcon = (type: string) => {
  switch (type) {
    case 'deployment': return <K8sIcon fontSize="small" />;
    case 'service': return <ServiceIcon fontSize="small" />;
    case 'configmap':
    case 'secret': return <VolumeIcon fontSize="small" />;
    default: return <ManifestIcon fontSize="small" />;
  }
};

const getValidationIcon = (validation?: { isValid: boolean; errors: string[]; warnings: string[] }) => {
  if (!validation) return <WarningIcon color="warning" fontSize="small" />;
  if (!validation.isValid) return <ErrorIcon color="error" fontSize="small" />;
  if (validation.warnings.length > 0) return <WarningIcon color="warning" fontSize="small" />;
  return <ValidIcon color="success" fontSize="small" />;
};

const ManifestDialog: React.FC<ManifestDialogProps> = ({
  open,
  onClose,
  onSubmit,
  manifest,
  creating,
  error,
  environments,
  selectedEnvironment,
}) => {
  const [name, setName] = useState(manifest?.name || '');
  const [description, setDescription] = useState(manifest?.description || '');
  const [content, setContent] = useState(manifest?.content || '# Kubernetes Manifest\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: my-app\n  template:\n    metadata:\n      labels:\n        app: my-app\n    spec:\n      containers:\n      - name: app\n        image: nginx:latest\n        ports:\n        - containerPort: 80');
  const [environmentId, setEnvironmentId] = useState(
    selectedEnvironment?.id || ''
  );
  const [previewMode, setPreviewMode] = useState(false);

  const { validation } = useMemo(() => parseYaml(content), [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
      environmentId: environmentId || undefined,
    });
  };

  const handleClose = () => {
    if (!creating) {
      setName('');
      setDescription('');
      setContent('');
      setEnvironmentId('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {manifest ? 'Edit Manifest' : 'Create Manifest'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <TextField
                  label="Manifest Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creating}
                  required
                  fullWidth
                  helperText="Descriptive name for this manifest"
                />
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <FormControl fullWidth>
                  <InputLabel>Environment (Optional)</InputLabel>
                  <Select
                    value={environmentId}
                    onChange={(e) => setEnvironmentId(e.target.value)}
                    disabled={creating}
                    label="Environment (Optional)"
                  >
                    <MenuItem value="">All Environments</MenuItem>
                    {environments.map((env) => (
                      <MenuItem key={env.id} value={env.id}>
                        {env.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              fullWidth
              multiline
              rows={2}
              helperText="Describe what this manifest does"
            />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Manifest Content
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={previewMode}
                      onChange={(e) => setPreviewMode(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Preview"
                />
              </Box>

              {previewMode ? (
                <Card variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <SyntaxHighlighter
                    language="yaml"
                    style={tomorrow}
                    customStyle={{
                      margin: 0,
                      fontSize: '0.875rem',
                    }}
                  >
                    {content}
                  </SyntaxHighlighter>
                </Card>
              ) : (
                <TextField
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={creating}
                  required
                  fullWidth
                  multiline
                  rows={12}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                  placeholder="Enter your Kubernetes manifest YAML here..."
                />
              )}
            </Box>

            {/* Validation Results */}
            {validation && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getValidationIcon(validation)}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Validation Results
                    </Typography>
                  </Box>

                  {validation.errors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Errors:
                      </Typography>
                      {validation.errors.map((error, index) => (
                        <Typography key={index} variant="body2">
                          • {error}
                        </Typography>
                      ))}
                    </Alert>
                  )}

                  {validation.warnings.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Warnings:
                      </Typography>
                      {validation.warnings.map((warning, index) => (
                        <Typography key={index} variant="body2">
                          • {warning}
                        </Typography>
                      ))}
                    </Alert>
                  )}

                  {validation.isValid && validation.errors.length === 0 && validation.warnings.length === 0 && (
                    <Alert severity="success">
                      Manifest is valid and ready to deploy.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={creating || !name.trim() || !content.trim() || (validation && !validation.isValid)}
          >
            {creating ? 'Saving...' : manifest ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ManifestCard: React.FC<{
  manifest: ManifestWithParsed;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onDownload: () => void;
}> = ({ manifest, onEdit, onDelete, onView, onDownload }) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const manifestType = getManifestType(manifest.content);
  const { validation } = parseYaml(manifest.content);

  return (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardHeader
        avatar={getManifestIcon(manifestType)}
        action={
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreIcon fontSize="small" />
          </IconButton>
        }
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {manifest.name}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Chip
              icon={getManifestIcon(manifestType)}
              label={manifestType}
              size="small"
              variant="outlined"
            />
            <Tooltip title={`${validation?.isValid ? 'Valid' : 'Invalid'} manifest`}>
              {getValidationIcon(validation)}
            </Tooltip>
          </Stack>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {manifest.description || 'No description provided'}
        </Typography>

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Environment:
            </Typography>
            <Typography variant="caption">
              All
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Last Modified:
            </Typography>
            <Typography variant="caption">
              {manifest.updatedAt ? new Date(manifest.updatedAt).toLocaleDateString() : 'Unknown'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Size:
            </Typography>
            <Typography variant="caption">
              {(manifest.content.length / 1024).toFixed(1)} KB
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { onView(); setMenuAnchor(null); }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View" />
        </MenuItem>
        <MenuItem onClick={() => { onEdit(); setMenuAnchor(null); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={() => { onDownload(); setMenuAnchor(null); }}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Download" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { onDelete(); setMenuAnchor(null); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </Card>
  );
};

const ManifestViewer: React.FC<{
  open: boolean;
  onClose: () => void;
  manifest: ManifestWithParsed;
}> = ({ open, onClose, manifest }) => {
  const [viewMode, setViewMode] = useState<'yaml' | 'parsed'>('yaml');

  const { parsed, validation } = parseYaml(manifest.content);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {manifest.name}
          </Typography>
          <Tabs
            value={viewMode}
            onChange={(_, value) => setViewMode(value)}
          >
            <Tab label="YAML" value="yaml" />
            <Tab label="Parsed" value="parsed" />
          </Tabs>
        </Box>
      </DialogTitle>
      <DialogContent>
        {viewMode === 'yaml' ? (
          <Card variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
            <SyntaxHighlighter
              language="yaml"
              style={tomorrow}
              customStyle={{
                margin: 0,
                fontSize: '0.875rem',
              }}
            >
              {manifest.content}
            </SyntaxHighlighter>
          </Card>
        ) : (
          <Card variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
            <SyntaxHighlighter
              language="json"
              style={tomorrow}
              customStyle={{
                margin: 0,
                fontSize: '0.875rem',
              }}
            >
              {JSON.stringify(parsed, null, 2)}
            </SyntaxHighlighter>
          </Card>
        )}

        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <Box sx={{ mt: 2 }}>
            {validation.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Validation Errors:
                </Typography>
                {validation.errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error}
                  </Typography>
                ))}
              </Alert>
            )}

            {validation.warnings.length > 0 && (
              <Alert severity="warning">
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Validation Warnings:
                </Typography>
                {validation.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2">
                    • {warning}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const ManifestManager: React.FC<ManifestManagerProps> = ({
  application,
  environments,
  manifests,
  selectedEnvironment,
  onRefresh,
}) => {
  console.log('ManifestManager render - manifests:', manifests.length, 'environments:', environments.length);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editingManifest, setEditingManifest] = useState<ManifestWithParsed | null>(null);
  const [viewingManifest, setViewingManifest] = useState<ManifestWithParsed | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterEnvironment, setFilterEnvironment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showNotification, setShowNotification] = useState(true);

  // Process manifests with parsing and validation
  const processedManifests = useMemo(() => {
    console.log('Processing manifests:', manifests.length, manifests);

    return manifests.map(manifest => {
      // Convert file.fileContent (Uint8Array) to string
      const content = manifest.file?.fileContent
        ? new TextDecoder().decode(manifest.file.fileContent)
        : '';

      console.log('Manifest content length:', content.length, 'for manifest:', manifest.name);

      const { parsed, validation } = parseYaml(content);
      return {
        ...manifest,
        content,
        parsed,
        validation,
      } as ManifestWithParsed;
    });
  }, [manifests]);

  // Filter manifests
  const filteredManifests = useMemo(() => {
    let filtered = processedManifests;

    // Note: Manifest type doesn't have environmentId field
    // This filter logic would need to be updated based on actual data structure
    if (filterEnvironment !== 'all') {
      // For now, skip environment filtering since manifests don't have environmentId
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(m => getManifestType(m.content) === filterType);
    }

    return filtered;
  }, [processedManifests, filterEnvironment, filterType]);

  const manifestTypes = useMemo(() => {
    const types = new Set(processedManifests.map(m => getManifestType(m.content)));
    return Array.from(types);
  }, [processedManifests]);

  const handleCreateManifest = async (data: {
    name: string;
    description?: string;
    content: string;
    environmentId?: string;
  }) => {
    setCreating(true);
    setError(null);

    try {
      // TODO: Call manifest service
      // await services.manifest.create({
      //   ...data,
      //   applicationId: application.id,
      // });

      console.log('Creating manifest for application:', application.id);

      console.log('Creating manifest:', data);

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDialogOpen(false);
      setEditingManifest(null);
      onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save manifest');
    } finally {
      setCreating(false);
    }
  };

  const handleEditManifest = (manifest: ManifestWithParsed) => {
    setEditingManifest(manifest);
    setDialogOpen(true);
  };

  const handleViewManifest = (manifest: ManifestWithParsed) => {
    setViewingManifest(manifest);
    setViewerOpen(true);
  };

  const handleDeleteManifest = (manifest: ManifestWithParsed) => {
    // TODO: Implement delete confirmation
    console.log('Delete manifest:', manifest);
  };

  const handleDownloadManifest = async (manifest: ManifestWithParsed) => {
    const blob = new Blob([manifest.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${manifest.name}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Kubernetes Manifests
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Create Manifest
        </Button>
      </Box>

      {/* Notification Message */}
      {showNotification && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          onClose={() => setShowNotification(false)}
        >
          Hello Blake
        </Alert>
      )}

      {/* Manifest Summary */}
      {processedManifests.length > 0 && (
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Manifest Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {processedManifests.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Manifests
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {processedManifests.filter(m => m.validation?.isValid).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valid
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {processedManifests.filter(m => m.validation?.warnings.length).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Warnings
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {processedManifests.filter(m => !m.validation?.isValid).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Errors
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {processedManifests.length > 0 && (
        <Card elevation={0} sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Filter by Environment</InputLabel>
                <Select
                  value={filterEnvironment}
                  onChange={(e) => setFilterEnvironment(e.target.value)}
                  label="Filter by Environment"
                >
                  <MenuItem value="all">All Environments</MenuItem>
                  <MenuItem value="global">Global</MenuItem>
                  {environments.map((env) => (
                    <MenuItem key={env.id} value={env.id}>
                      {env.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filter by Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {manifestTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Manifest Cards */}
      {filteredManifests.length > 0 ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3
        }}>
          {filteredManifests.map((manifest) => (
            <ManifestCard
              key={manifest.id}
              manifest={manifest}
              onEdit={() => handleEditManifest(manifest)}
              onDelete={() => handleDeleteManifest(manifest)}
              onView={() => handleViewManifest(manifest)}
              onDownload={() => handleDownloadManifest(manifest)}
            />
          ))}
        </Box>
      ) : (
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CodeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Manifests Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first Kubernetes manifest to define how your application should be deployed.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Create Manifest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manifest Dialog */}
      <ManifestDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingManifest(null);
          setError(null);
        }}
        onSubmit={handleCreateManifest}
        manifest={editingManifest}
        creating={creating}
        error={error}
        environments={environments}
        selectedEnvironment={selectedEnvironment}
      />

      {/* Manifest Viewer */}
      {viewingManifest && (
        <ManifestViewer
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setViewingManifest(null);
          }}
          manifest={viewingManifest}
        />
      )}
    </Box>
  );
};

export default ManifestManager;
