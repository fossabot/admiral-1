import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
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
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  MoreVert as MoreIcon,
  Restore as RollbackIcon,
  Visibility as ViewIcon,
  Compare as CompareIcon,
  Download as DownloadIcon,
  PlayArrow as DeployIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Code as CodeIcon,
  BugReport as BugIcon,
  NewReleases as ReleaseIcon,
  Build as BuildIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import type { Application } from '@/types/application';
import type { Environment } from '@/types/environment';
import type { Revision } from '@/types/revision';

interface RevisionHistoryProps {
  application: Application;
  environments: Environment[];
  revisions: Revision[];
  selectedEnvironment: Environment | null;
  onEnvironmentChange: (environment: Environment | null) => void;
  onRefresh: () => void;
}

interface ExtendedRevision extends Revision {
  version: string;
  deploymentStatus: 'success' | 'failed' | 'pending' | 'cancelled';
  deploymentTime?: Date;
  rollbackCount: number;
  changes: {
    type: 'code' | 'config' | 'manifest' | 'variable';
    description: string;
  }[];
  metrics?: {
    deploymentDuration: number;
    successRate: number;
    performance: number;
  };
}

interface RollbackDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  revision: ExtendedRevision;
  loading: boolean;
}

interface RevisionCompareDialogProps {
  open: boolean;
  onClose: () => void;
  revision1: ExtendedRevision;
  revision2: ExtendedRevision;
}

// Generate mock extended revision data
const generateExtendedRevision = (revision: Revision): ExtendedRevision => {
  const statuses: Array<'success' | 'failed' | 'pending' | 'cancelled'> = ['success', 'failed', 'pending', 'cancelled'];
  const changeTypes: Array<'code' | 'config' | 'manifest' | 'variable'> = ['code', 'config', 'manifest', 'variable'];

  return {
    ...revision,
    version: revision.id.slice(0, 8), // Use first 8 chars of ID as version
    deploymentStatus: statuses[Math.floor(Math.random() * statuses.length)],
    deploymentTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    rollbackCount: Math.floor(Math.random() * 3),
    changes: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
      type: changeTypes[Math.floor(Math.random() * changeTypes.length)],
      description: 'Updated configuration and fixed performance issues',
    })),
    metrics: {
      deploymentDuration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
      successRate: Math.random() * 100,
      performance: Math.random() * 100,
    },
  };
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': return <SuccessIcon sx={{ color: 'success.main' }} />;
    case 'failed': return <ErrorIcon sx={{ color: 'error.main' }} />;
    case 'pending': return <PendingIcon sx={{ color: 'info.main' }} />;
    case 'cancelled': return <CancelIcon sx={{ color: 'warning.main' }} />;
    default: return <PendingIcon sx={{ color: 'info.main' }} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'success';
    case 'failed': return 'error';
    case 'pending': return 'info';
    case 'cancelled': return 'warning';
    default: return 'info';
  }
};

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'code': return <CodeIcon fontSize="small" />;
    case 'config': return <BuildIcon fontSize="small" />;
    case 'manifest': return <ReleaseIcon fontSize="small" />;
    case 'variable': return <BugIcon fontSize="small" />;
    default: return <CodeIcon fontSize="small" />;
  }
};

const RollbackDialog: React.FC<RollbackDialogProps> = ({
  open,
  onClose,
  onConfirm,
  revision,
  loading,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Rollback to Revision {revision.version}
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Are you sure you want to rollback?
          </Typography>
          <Typography variant="body2">
            This will revert your application to revision {revision.version}.
            Any changes made after this revision will be lost.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Revision Details
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Version:</Typography>
              <Typography variant="body2">{revision.version}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Created:</Typography>
              <Typography variant="body2">
                {revision.createdAt ? new Date(revision.createdAt).toLocaleString() : 'Unknown'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Status:</Typography>
              <Chip
                label={revision.deploymentStatus}
                color={getStatusColor(revision.deploymentStatus) as 'success' | 'warning' | 'error' | 'info'}
                size="small"
              />
            </Box>
          </Stack>
        </Box>

        <TextField
          label="Rollback Reason (Optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
          fullWidth
          multiline
          rows={3}
          placeholder="Describe why you're rolling back..."
          helperText="This will be recorded in the deployment history"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={loading}
        >
          {loading ? 'Rolling Back...' : 'Rollback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RevisionCompareDialog: React.FC<RevisionCompareDialogProps> = ({
  open,
  onClose,
  revision1,
  revision2,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Compare Revisions: {revision1.version} vs {revision2.version}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6 }}>
            <Card variant="outlined">
              <CardHeader
                title={`Revision ${revision1.version}`}
                subheader={revision1.createdAt ? new Date(revision1.createdAt).toLocaleString() : 'Unknown'}
              />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Status
                    </Typography>
                    <Chip
                      label={revision1.deploymentStatus}
                      color={getStatusColor(revision1.deploymentStatus) as 'success' | 'warning' | 'error' | 'info'}
                      size="small"
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Changes
                    </Typography>
                    <List dense>
                      {revision1.changes.map((change, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemAvatar sx={{ minWidth: 32 }}>
                            {getChangeIcon(change.type)}
                          </ListItemAvatar>
                          <ListItemText
                            primary={change.description}
                            secondary={change.type}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Card variant="outlined">
              <CardHeader
                title={`Revision ${revision2.version}`}
                subheader={revision2.createdAt ? new Date(revision2.createdAt).toLocaleString() : 'Unknown'}
              />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Status
                    </Typography>
                    <Chip
                      label={revision2.deploymentStatus}
                      color={getStatusColor(revision2.deploymentStatus) as 'success' | 'warning' | 'error' | 'info'}
                      size="small"
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Changes
                    </Typography>
                    <List dense>
                      {revision2.changes.map((change, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemAvatar sx={{ minWidth: 32 }}>
                            {getChangeIcon(change.type)}
                          </ListItemAvatar>
                          <ListItemText
                            primary={change.description}
                            secondary={change.type}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const RevisionCard: React.FC<{
  revision: ExtendedRevision;
  isLatest: boolean;
  onRollback: () => void;
  onView: () => void;
  onCompare: () => void;
  onDownload: () => void;
}> = ({ revision, isLatest, onRollback, onView, onCompare, onDownload }) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Card
      elevation={isLatest ? 3 : 1}
      sx={{
        border: isLatest ? 2 : 1,
        borderColor: isLatest ? 'primary.main' : 'divider',
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: `${getStatusColor(revision.deploymentStatus)}.lighter` }}>
            {getStatusIcon(revision.deploymentStatus)}
          </Avatar>
        }
        action={
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreIcon fontSize="small" />
          </IconButton>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {revision.version}
            </Typography>
            {isLatest && (
              <Chip label="Current" color="primary" size="small" />
            )}
          </Box>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Chip
              label={revision.deploymentStatus}
              color={getStatusColor(revision.deploymentStatus) as 'success' | 'warning' | 'error' | 'info'}
              size="small"
            />
            {revision.rollbackCount > 0 && (
              <Chip
                label={`${revision.rollbackCount} rollbacks`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Created: {revision.createdAt ? new Date(revision.createdAt).toLocaleString() : 'Unknown'}
            </Typography>
            {revision.deploymentTime && (
              <Typography variant="body2" color="text.secondary">
                Deployed: {revision.deploymentTime.toLocaleString()}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Changes ({revision.changes.length})
            </Typography>
            <Stack spacing={0.5}>
              {revision.changes.slice(0, 2).map((change, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getChangeIcon(change.type)}
                  <Typography variant="body2" color="text.secondary">
                    {change.description}
                  </Typography>
                </Box>
              ))}
              {revision.changes.length > 2 && (
                <Typography variant="caption" color="text.secondary">
                  +{revision.changes.length - 2} more changes
                </Typography>
              )}
            </Stack>
          </Box>

          {revision.metrics && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {revision.metrics.deploymentDuration}s
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Deploy Time
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {revision.metrics.successRate.toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {revision.metrics.performance.toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Performance
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Stack>
      </CardContent>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { onView(); setMenuAnchor(null); }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={() => { onCompare(); setMenuAnchor(null); }}>
          <ListItemIcon><CompareIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Compare" />
        </MenuItem>
        <MenuItem onClick={() => { onDownload(); setMenuAnchor(null); }}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Download" />
        </MenuItem>
        {!isLatest && (
          <>
            <Divider />
            <MenuItem onClick={() => { onRollback(); setMenuAnchor(null); }}>
              <ListItemIcon><RollbackIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Rollback" />
            </MenuItem>
          </>
        )}
      </Menu>
    </Card>
  );
};

const RevisionHistory: React.FC<RevisionHistoryProps> = ({
  revisions,
  onRefresh,
}) => {
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [rollbackRevision, setRollbackRevision] = useState<ExtendedRevision | null>(null);
  const [compareRevisions, setCompareRevisions] = useState<[ExtendedRevision, ExtendedRevision] | null>(null);
  const [rollbacking, setRollbacking] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');

  // Process revisions with extended data
  const extendedRevisions = useMemo(() => {
    return revisions.map(generateExtendedRevision).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [revisions]);

  // Filter revisions
  const filteredRevisions = useMemo(() => {
    let filtered = extendedRevisions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.deploymentStatus === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.version.toLowerCase().includes(term) ||
        r.changes.some(c => c.description.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [extendedRevisions, statusFilter, searchTerm]);

  const handleRollback = async (reason?: string) => {
    if (!rollbackRevision) return;

    setRollbacking(true);
    try {
      // TODO: Call revision service to rollback
      // await services.revision.rollback(rollbackRevision.id, { reason });

      console.log('Rolling back to revision:', rollbackRevision.id, 'reason:', reason);

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));

      setRollbackDialogOpen(false);
      setRollbackRevision(null);
      onRefresh();
    } catch (error) {
      console.error('Rollback failed:', error);
    } finally {
      setRollbacking(false);
    }
  };

  const handleViewRevision = (revision: ExtendedRevision) => {
    // TODO: Navigate to revision details or open detailed view
    console.log('View revision:', revision);
  };

  const handleCompareRevision = (revision: ExtendedRevision) => {
    // For now, compare with the previous revision
    const currentIndex = filteredRevisions.findIndex(r => r.id === revision.id);
    const previousRevision = filteredRevisions[currentIndex + 1];

    if (previousRevision) {
      setCompareRevisions([revision, previousRevision]);
      setCompareDialogOpen(true);
    }
  };

  const handleDownloadRevision = async (revision: ExtendedRevision) => {
    // TODO: Download revision artifacts
    console.log('Download revision:', revision);
  };

  const deploymentSummary = useMemo(() => {
    return {
      total: extendedRevisions.length,
      successful: extendedRevisions.filter(r => r.deploymentStatus === 'success').length,
      failed: extendedRevisions.filter(r => r.deploymentStatus === 'failed').length,
      pending: extendedRevisions.filter(r => r.deploymentStatus === 'pending').length,
    };
  }, [extendedRevisions]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Deployment History
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </Button>
        </Stack>
      </Box>

      {/* Deployment Summary */}
      {extendedRevisions.length > 0 && (
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Deployment Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {deploymentSummary.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Deployments
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {deploymentSummary.successful}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {deploymentSummary.failed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                    {deploymentSummary.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {extendedRevisions.length > 0 && (
        <Card elevation={0} sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Search revisions..."
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

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Filter by Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Revision Content */}
      {filteredRevisions.length > 0 ? (
        viewMode === 'cards' ? (
          <Grid container spacing={3}>
            {filteredRevisions.map((revision, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={revision.id}>
                <RevisionCard
                  revision={revision}
                  isLatest={index === 0}
                  onRollback={() => {
                    setRollbackRevision(revision);
                    setRollbackDialogOpen(true);
                  }}
                  onView={() => handleViewRevision(revision)}
                  onCompare={() => handleCompareRevision(revision)}
                  onDownload={() => handleDownloadRevision(revision)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card elevation={1}>
            <CardContent>
              <Timeline>
                {filteredRevisions.map((revision, index) => (
                  <TimelineItem key={revision.id}>
                    <TimelineSeparator>
                      <TimelineDot color={getStatusColor(revision.deploymentStatus) as 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'}>
                        {getStatusIcon(revision.deploymentStatus)}
                      </TimelineDot>
                      {index < filteredRevisions.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                        Revision {revision.version}
                        {index === 0 && (
                          <Chip label="Current" color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {revision.createdAt ? new Date(revision.createdAt).toLocaleString() : 'Unknown'}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip
                          label={revision.deploymentStatus}
                          color={getStatusColor(revision.deploymentStatus) as 'success' | 'warning' | 'error' | 'info'}
                          size="small"
                        />
                      </Stack>
                      <Typography variant="body2">
                        {revision.changes.length} changes including {revision.changes[0]?.description}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        )
      ) : (
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CalendarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Deployment History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || statusFilter !== 'all'
                ? 'No revisions match your current filters.'
                : 'Deploy your application to see deployment history here.'
              }
            </Typography>
            {searchTerm || statusFilter !== 'all' ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<DeployIcon />}
                onClick={() => console.log('Navigate to deploy')}
              >
                Deploy Now
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rollback Dialog */}
      {rollbackRevision && (
        <RollbackDialog
          open={rollbackDialogOpen}
          onClose={() => {
            setRollbackDialogOpen(false);
            setRollbackRevision(null);
          }}
          onConfirm={handleRollback}
          revision={rollbackRevision}
          loading={rollbacking}
        />
      )}

      {/* Compare Dialog */}
      {compareRevisions && (
        <RevisionCompareDialog
          open={compareDialogOpen}
          onClose={() => {
            setCompareDialogOpen(false);
            setCompareRevisions(null);
          }}
          revision1={compareRevisions[0]}
          revision2={compareRevisions[1]}
        />
      )}
    </Box>
  );
};

export default RevisionHistory;
