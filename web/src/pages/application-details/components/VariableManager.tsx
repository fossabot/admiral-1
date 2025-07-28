import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  FormControlLabel,
  Switch,
  Alert,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  Public as GlobalIcon,
  Apps as AppIcon,
  CloudQueue as EnvIcon,
  Warning as OverrideIcon,
} from '@mui/icons-material';

import type { Application } from '@/types/application';
import type { Environment } from '@/types/environment';
import type { Variable } from '@/types/variable';

interface VariableManagerProps {
  application: Application;
  environments: Environment[];
  variables: Variable[];
  selectedEnvironment: Environment | null;
  onEnvironmentChange: (environment: Environment | null) => void;
  onRefresh: () => void;
}

interface VariableWithSource extends Variable {
  source: 'global' | 'application' | 'environment';
  isOverridden?: boolean;
  overriddenBy?: 'application' | 'environment';
}

type VariableLevel = 'all' | 'global' | 'application' | 'environment';

interface VariableDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    key: string;
    value: string;
    description?: string;
    isSensitive: boolean;
    level: 'global' | 'application' | 'environment';
    environmentId?: string;
  }) => void;
  variable?: VariableWithSource | null;
  creating: boolean;
  error: string | null;
  environments: Environment[];
  selectedEnvironment: Environment | null;
}

const VariableDialog: React.FC<VariableDialogProps> = ({
  open,
  onClose,
  onSubmit,
  variable,
  creating,
  error,
  environments,
  selectedEnvironment,
}) => {
  const [key, setKey] = useState(variable?.key || '');
  const [value, setValue] = useState(variable?.value || '');
  const [description, setDescription] = useState(variable?.description || '');
  const [isSensitive, setIsSensitive] = useState(variable?.isSensitive || false);
  const [level, setLevel] = useState<'global' | 'application' | 'environment'>(
    variable?.source || 'application'
  );
  const [environmentId, setEnvironmentId] = useState(
    variable?.environmentId || selectedEnvironment?.id || ''
  );
  const [showValue, setShowValue] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      key: key.trim(),
      value: value.trim(),
      description: description.trim() || undefined,
      isSensitive,
      level,
      environmentId: level === 'environment' ? environmentId : undefined,
    });
  };

  const handleClose = () => {
    if (!creating) {
      setKey('');
      setValue('');
      setDescription('');
      setIsSensitive(false);
      setLevel('application');
      setEnvironmentId('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {variable ? 'Edit Variable' : 'Create Variable'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Variable Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={creating || !!variable}
              required
              fullWidth
              helperText="Must be unique within the scope"
            />

            <TextField
              label="Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={creating}
              required
              fullWidth
              multiline={value.length > 50}
              rows={value.length > 50 ? 3 : 1}
              type={isSensitive && !showValue ? 'password' : 'text'}
              InputProps={{
                endAdornment: isSensitive ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowValue(!showValue)}
                      edge="end"
                      size="small"
                    >
                      {showValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />

            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              fullWidth
              multiline
              rows={2}
              helperText="Describe what this variable is used for"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isSensitive}
                  onChange={(e) => setIsSensitive(e.target.checked)}
                  disabled={creating}
                />
              }
              label="Sensitive Variable"
            />

            <FormControl fullWidth>
              <InputLabel>Variable Level</InputLabel>
              <Select
                value={level}
                onChange={(e) => setLevel(e.target.value as 'global' | 'application' | 'environment')}
                disabled={creating || !!variable}
                label="Variable Level"
              >
                <MenuItem value="global">Global</MenuItem>
                <MenuItem value="application">Application</MenuItem>
                <MenuItem value="environment">Environment</MenuItem>
              </Select>
            </FormControl>

            {level === 'environment' && (
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={environmentId}
                  onChange={(e) => setEnvironmentId(e.target.value)}
                  disabled={creating}
                  required
                  label="Environment"
                >
                  {environments.map((env) => (
                    <MenuItem key={env.id} value={env.id}>
                      {env.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            disabled={creating || !key.trim() || !value.trim()}
          >
            {creating ? 'Saving...' : variable ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const VariableRow: React.FC<{
  variable: VariableWithSource;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}> = ({ variable, onEdit, onDelete, onCopy }) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showValue, setShowValue] = useState(false);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'global': return <GlobalIcon fontSize="small" />;
      case 'application': return <AppIcon fontSize="small" />;
      case 'environment': return <EnvIcon fontSize="small" />;
      default: return null;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'global': return 'info';
      case 'application': return 'primary';
      case 'environment': return 'success';
      default: return 'default';
    }
  };

  const displayValue = variable.isSensitive && !showValue ? '••••••••' : variable.value;

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
            {variable.key}
          </Typography>
          {variable.isOverridden && (
            <Tooltip title={`Overridden by ${variable.overriddenBy}`}>
              <OverrideIcon fontSize="small" color="warning" />
            </Tooltip>
          )}
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 300 }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: variable.isSensitive ? 'inherit' : 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {displayValue}
          </Typography>
          {variable.isSensitive && (
            <IconButton
              size="small"
              onClick={() => setShowValue(!showValue)}
            >
              {showValue ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          )}
          <IconButton size="small" onClick={onCopy}>
            <CopyIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>

      <TableCell>
        {(() => {
          const icon = getSourceIcon(variable.source);
          return (
            <Chip
              {...(icon && { icon })}
              label={variable.source}
              size="small"
              color={getSourceColor(variable.source) as 'success' | 'warning' | 'error' | 'info'}
              variant="outlined"
            />
          );
        })()}
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {variable.description || '—'}
        </Typography>
      </TableCell>

      <TableCell>
        {variable.isSensitive && (
          <Chip label="Sensitive" size="small" color="warning" variant="outlined" />
        )}
      </TableCell>

      <TableCell align="right">
        <IconButton
          size="small"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <MoreIcon fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => { onEdit(); setMenuAnchor(null); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>
          <MenuItem onClick={() => { onCopy(); setMenuAnchor(null); }}>
            <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Copy Value" />
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
      </TableCell>
    </TableRow>
  );
};

const VariableManager: React.FC<VariableManagerProps> = ({
  environments,
  variables,
  selectedEnvironment,
  onRefresh,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<VariableWithSource | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<VariableLevel>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Process variables to identify overrides
  const processedVariables = useMemo(() => {
    const variableMap = new Map<string, VariableWithSource[]>();

    // Group variables by key
    (variables as VariableWithSource[]).forEach(variable => {
      if (!variableMap.has(variable.key)) {
        variableMap.set(variable.key, []);
      }
      variableMap.get(variable.key)!.push(variable);
    });

    // Mark overrides
    const result: VariableWithSource[] = [];
    variableMap.forEach((vars) => {
      const sorted = vars.sort((a, b) => {
        const order = { global: 0, application: 1, environment: 2 };
        return order[a.source] - order[b.source];
      });

      sorted.forEach((variable, index) => {
        const isOverridden = index < sorted.length - 1;
        const overriddenBy = index < sorted.length - 1
          ? sorted[sorted.length - 1].source as 'application' | 'environment'
          : undefined;

        result.push({
          ...variable,
          isOverridden,
          overriddenBy,
        });
      });
    });

    return result;
  }, [variables]);

  // Filter variables
  const filteredVariables = useMemo(() => {
    let filtered = processedVariables;

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(v => v.source === levelFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.key.toLowerCase().includes(term) ||
        v.value.toLowerCase().includes(term) ||
        (v.description && v.description.toLowerCase().includes(term))
      );
    }

    return filtered.sort((a, b) => a.key.localeCompare(b.key));
  }, [processedVariables, levelFilter, searchTerm]);

  const handleCreateVariable = async (data: {
    key: string;
    value: string;
    description?: string;
    isSensitive: boolean;
    level: 'global' | 'application' | 'environment';
    environmentId?: string;
  }) => {
    setCreating(true);
    setError(null);

    try {
      // TODO: Call variable service
      // await services.variable.create({
      //   ...data,
      //   applicationId: data.level !== 'global' ? application.id : undefined,
      // });

      console.log('Creating variable:', data);

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDialogOpen(false);
      setEditingVariable(null);
      onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save variable');
    } finally {
      setCreating(false);
    }
  };

  const handleEditVariable = (variable: VariableWithSource) => {
    setEditingVariable(variable);
    setDialogOpen(true);
  };

  const handleDeleteVariable = (variable: VariableWithSource) => {
    // TODO: Implement delete confirmation
    console.log('Delete variable:', variable);
  };

  const handleCopyValue = async (variable: VariableWithSource) => {
    try {
      await navigator.clipboard.writeText(variable.value);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getEffectiveVariables = () => {
    const effective = new Map<string, VariableWithSource>();

    processedVariables.forEach(variable => {
      if (!effective.has(variable.key) || !variable.isOverridden) {
        effective.set(variable.key, variable);
      }
    });

    return Array.from(effective.values()).sort((a, b) => a.key.localeCompare(b.key));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Variables
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Variable
        </Button>
      </Box>

      {/* Variable Hierarchy Info */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Variable Hierarchy
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Variables are resolved in the following order: Environment → Application → Global
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip
              icon={<GlobalIcon fontSize="small" />}
              label={`Global (${processedVariables.filter(v => v.source === 'global').length})`}
              color="info"
              variant="outlined"
            />
            <Chip
              icon={<AppIcon fontSize="small" />}
              label={`Application (${processedVariables.filter(v => v.source === 'application').length})`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<EnvIcon fontSize="small" />}
              label={`Environment (${processedVariables.filter(v => v.source === 'environment').length})`}
              color="success"
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card elevation={0} sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />

            <Tabs
              value={levelFilter}
              onChange={(_, value) => setLevelFilter(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All" value="all" />
              <Tab label="Global" value="global" />
              <Tab label="Application" value="application" />
              <Tab label="Environment" value="environment" />
            </Tabs>
          </Stack>
        </CardContent>
      </Card>

      {/* Variables Table */}
      <Card elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVariables.length > 0 ? (
                filteredVariables.map((variable) => (
                  <VariableRow
                    key={`${variable.source}-${variable.key}`}
                    variable={variable}
                    onEdit={() => handleEditVariable(variable)}
                    onDelete={() => handleDeleteVariable(variable)}
                    onCopy={() => handleCopyValue(variable)}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'No variables match your search' : 'No variables found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Effective Variables Summary */}
      {processedVariables.some(v => v.isOverridden) && (
        <Card elevation={1} sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Effective Variables ({getEffectiveVariables().length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These are the actual variables that will be used after applying the hierarchy rules.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {getEffectiveVariables().slice(0, 10).map((variable) => (
                <Chip
                  key={variable.key}
                  label={variable.key}
                  size="small"
                  color={getSourceColor(variable.source) as 'success' | 'warning' | 'error' | 'info'}
                  variant="outlined"
                />
              ))}
              {getEffectiveVariables().length > 10 && (
                <Chip
                  label={`+${getEffectiveVariables().length - 10} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Variable Dialog */}
      <VariableDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingVariable(null);
          setError(null);
        }}
        onSubmit={handleCreateVariable}
        variable={editingVariable}
        creating={creating}
        error={error}
        environments={environments}
        selectedEnvironment={selectedEnvironment}
      />
    </Box>
  );
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'global': return 'info';
    case 'application': return 'primary';
    case 'environment': return 'success';
    default: return 'default';
  }
};

export default VariableManager;
