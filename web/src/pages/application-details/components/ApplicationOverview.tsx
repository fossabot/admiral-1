import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Storage as StorageIcon,
  CloudQueue as CloudIcon,
  AccountTree as BranchIcon,
  Timeline as TimelineIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';

import type { Application } from '@/types/application';
import type { Environment } from '@/types/environment';
import type { Variable } from '@/types/variable';
import type { Manifest } from '@/types/manifest';
import type { Revision } from '@/types/revision';

interface ApplicationOverviewProps {
  application: Application;
  environments: Environment[];
  variables: Variable[];
  manifests: Manifest[];
  revisions: Revision[];
  selectedEnvironment: Environment | null;
  onEnvironmentChange: (environment: Environment | null) => void;
  onRefresh: () => void;
}

// Mock health/status data - in real app this would come from monitoring
const generateHealthData = () => ({
  status: Math.random() > 0.7 ? 'healthy' : Math.random() > 0.4 ? 'warning' : 'error',
  uptime: Math.random() * 30, // days
  cpu: Math.random() * 100,
  memory: Math.random() * 100,
  requests: Math.floor(Math.random() * 10000),
  errors: Math.floor(Math.random() * 100),
  lastDeployment: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
});

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  const icons = {
    healthy: <SuccessIcon sx={{ color: 'success.main' }} />,
    warning: <WarningIcon sx={{ color: 'warning.main' }} />,
    error: <ErrorIcon sx={{ color: 'error.main' }} />,
    pending: <PendingIcon sx={{ color: 'info.main' }} />,
  };

  return icons[status as keyof typeof icons] || icons.pending;
};

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const configs = {
    healthy: { label: 'Healthy', color: 'success' as const },
    warning: { label: 'Warning', color: 'warning' as const },
    error: { label: 'Error', color: 'error' as const },
    pending: { label: 'Pending', color: 'info' as const },
  };

  const config = configs[status as keyof typeof configs] || configs.pending;

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  progress?: number;
  color?: string;
  icon: React.ReactNode;
}> = ({ title, value, subtitle, progress, color = 'primary', icon }) => (
  <Card elevation={2} sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main`, mr: 2 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>

      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {subtitle}
        </Typography>
      )}

      {typeof progress === 'number' && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: `${color}.main`,
            },
          }}
        />
      )}
    </CardContent>
  </Card>
);

const ApplicationOverview: React.FC<ApplicationOverviewProps> = ({
  application,
  environments,
  variables,
  manifests,
  revisions,
  selectedEnvironment,
}) => {
  const healthData = generateHealthData();

  // Note: environment health summary calculated but not currently displayed
  // This could be used for a future dashboard section

  // Recent activity (mock data)
  const recentActivity = [
    {
      id: '1',
      type: 'deployment',
      message: `Deployed to ${selectedEnvironment?.name || 'production'}`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'success',
    },
    {
      id: '2',
      type: 'variable',
      message: 'Updated environment variables',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'info',
    },
    {
      id: '3',
      type: 'manifest',
      message: 'Modified deployment manifest',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'info',
    },
  ];

  return (
    <Box>
      {/* Application Info Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Application Information
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={1}>
              <CardContent>
                <List disablePadding>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <StorageIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Application ID"
                      secondary={application.id}
                      secondaryTypographyProps={{
                        sx: {
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          wordBreak: 'break-all',
                        }
                      }}
                    />
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CalendarIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Created"
                      secondary={application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'Unknown'}
                    />
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <UpdateIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Updated"
                      secondary={application.updatedAt ? new Date(application.updatedAt).toLocaleDateString() : 'Unknown'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Resources
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Environments
                    </Typography>
                    <Chip label={environments.length} size="small" />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Variables
                    </Typography>
                    <Chip label={variables.length} size="small" />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Manifests
                    </Typography>
                    <Chip label={manifests.length} size="small" />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Revisions
                    </Typography>
                    <Chip label={revisions.length} size="small" />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Health & Metrics Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Health & Performance
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Overall Status"
              value={<StatusChip status={healthData.status} />}
              subtitle={`Last checked: ${new Date().toLocaleTimeString()}`}
              icon={<StatusIcon status={healthData.status} />}
              color="primary"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Uptime"
              value={`${healthData.uptime.toFixed(1)} days`}
              subtitle="Since last restart"
              icon={<TimelineIcon />}
              color="success"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="CPU Usage"
              value={`${healthData.cpu.toFixed(0)}%`}
              progress={healthData.cpu}
              icon={<CloudIcon />}
              color={healthData.cpu > 80 ? 'error' : healthData.cpu > 60 ? 'warning' : 'success'}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Memory Usage"
              value={`${healthData.memory.toFixed(0)}%`}
              progress={healthData.memory}
              icon={<StorageIcon />}
              color={healthData.memory > 80 ? 'error' : healthData.memory > 60 ? 'warning' : 'success'}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Environment Status */}
      {environments.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Environment Status
          </Typography>

          <Grid container spacing={3}>
            {environments.map((env) => {
              const status = Math.random() > 0.7 ? 'healthy' : Math.random() > 0.4 ? 'warning' : 'error';
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={env.id}>
                  <Card
                    elevation={1}
                    sx={{
                      cursor: 'pointer',
                      border: selectedEnvironment?.id === env.id ? 2 : 1,
                      borderColor: selectedEnvironment?.id === env.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        elevation: 3,
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {env.name}
                        </Typography>
                        <StatusChip status={status} />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Namespace: {env.namespace || 'default'}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <BranchIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Last deployed: Recently
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Recent Activity */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Recent Activity
        </Typography>

        <Card elevation={1}>
          <CardContent>
            {recentActivity.length > 0 ? (
              <List disablePadding>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemIcon>
                        <StatusIcon status={activity.status} />
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.timestamp.toLocaleString()}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ApplicationOverview;
