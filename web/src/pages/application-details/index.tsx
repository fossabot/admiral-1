import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Home as HomeIcon,
  Apps as AppsIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  History as HistoryIcon,
  Wifi as RealTimeIcon,
  WifiOff as RealTimeOffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useApplicationDetails } from './hooks/use-application-details';
import ApplicationOverview from './components/ApplicationOverview';
import EnvironmentManager from './components/EnvironmentManager';
import VariableManager from './components/VariableManager';
import ManifestManager from './components/ManifestManager';
import RevisionHistory from './components/RevisionHistory';
import { PageContainer, PageHeader, LoadingState, EmptyState } from '@/components';

import styles from './styles.module.scss';

type TabValue = 'overview' | 'environments' | 'variables' | 'manifests' | 'revisions';

const ApplicationDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const {
    application,
    environments,
    variables,
    manifests,
    revisions,
    selectedEnvironment,
    loading,
    error,
    initialized,
    realTimeEnabled,
    lastUpdated,
    selectEnvironment,
    refreshAll,
    toggleRealTime,
  } = useApplicationDetails();

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    console.log('Switching to tab:', newValue);
    setActiveTab(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleRefresh = () => {
    refreshAll();
  };

  const handleEditApplication = () => {
    // TODO: Open edit dialog
    handleMenuClose();
  };

  const handleDeleteApplication = () => {
    // TODO: Open delete confirmation
    handleMenuClose();
  };

  if (loading && !initialized) {
    return (
      <PageContainer maxWidth="xl" variant="simple">
        <LoadingState message="Loading application details..." />
      </PageContainer>
    );
  }

  if (error && !application) {
    return (
      <PageContainer maxWidth="xl" variant="simple">
        <EmptyState
          title="Failed to Load Application"
          description={error || "Something went wrong while loading the application."}
          actions={
            <IconButton color="inherit" size="small" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          }
        />
      </PageContainer>
    );
  }

  if (!application) {
    return (
      <PageContainer maxWidth="xl" variant="simple">
        <EmptyState
          title="Application Not Found"
          description="The requested application could not be found. It may have been deleted or you may not have access to it."
        />
      </PageContainer>
    );
  }

  const tabConfigs = [
    {
      value: 'overview',
      label: 'Overview',
      icon: <AppsIcon fontSize="small" />,
      component: ApplicationOverview
    },
    {
      value: 'environments',
      label: `Environments${environments.length > 0 ? ` (${environments.length})` : ''}`,
      icon: undefined,
      component: EnvironmentManager
    },
    {
      value: 'variables',
      label: `Variables${variables.length > 0 ? ` (${variables.length})` : ''}`,
      icon: undefined,
      component: VariableManager
    },
    {
      value: 'manifests',
      label: `Manifests${manifests.length > 0 ? ` (${manifests.length})` : ''}`,
      icon: undefined,
      component: ManifestManager
    },
    {
      value: 'revisions',
      label: `Revisions${revisions.length > 0 ? ` (${revisions.length})` : ''}`,
      icon: <HistoryIcon fontSize="small" />,
      component: RevisionHistory
    },
  ] as const;

  const ActiveComponent = tabConfigs.find(tab => tab.value === activeTab)?.component || ApplicationOverview;

  console.log('Active tab:', activeTab, 'Component:', ActiveComponent?.name || 'Unknown');
  console.log('Data counts - manifests:', manifests.length, 'environments:', environments.length, 'variables:', variables.length);

  return (
    <PageContainer maxWidth="xl" variant="simple">
      <Box className={styles.pageContent}>
        <PageHeader
          title={application.name}
          description={application.description || undefined}
          loading={loading}
          breadcrumbs={[
            { label: 'Home', href: '/', icon: <HomeIcon fontSize="small" /> },
            { label: 'Applications', href: '/applications', icon: <AppsIcon fontSize="small" /> },
          ]}
          badge={selectedEnvironment && (
            <Chip
              label={`Current: ${selectedEnvironment.name}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          actions={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Real-time monitoring toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeEnabled}
                    onChange={toggleRealTime}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {realTimeEnabled ? <RealTimeIcon fontSize="small" /> : <RealTimeOffIcon fontSize="small" />}
                    <Typography variant="caption">
                      Real-time
                    </Typography>
                  </Box>
                }
                sx={{
                  mr: 1,
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  },
                }}
              />

              {/* Last updated indicator */}
              {lastUpdated && (
                <Tooltip title={`Last updated: ${lastUpdated.toLocaleString()}`}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    Updated {lastUpdated.toLocaleTimeString()}
                  </Typography>
                </Tooltip>
              )}

              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh data"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <RefreshIcon />
              </IconButton>

              <IconButton
                onClick={handleMenuClick}
                title="Application actions"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <MoreIcon />
              </IconButton>

              {/* Action Menu */}
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { minWidth: 180 } }}
              >
                <MenuItem onClick={() => navigate(`/applications/${application.id}/deploy`)}>
                  <ListItemIcon><LaunchIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Deploy" />
                </MenuItem>
                <MenuItem onClick={handleEditApplication}>
                  <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Edit Application" />
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={handleDeleteApplication}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText primary="Delete Application" />
                </MenuItem>
              </Menu>
            </Box>
          }
        />

        {/* Navigation Tabs */}
        <Box className={styles.tabsSection}>
          <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Application details tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 48,
                },
              }}
            >
              {tabConfigs.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  {...(tab.icon && { icon: tab.icon, iconPosition: "start" as const })}
                  sx={{
                    '& .MuiTab-iconWrapper': {
                      marginRight: 1,
                      marginBottom: 0,
                    },
                  }}
                />
              ))}
            </Tabs>
          </Paper>
        </Box>

        {/* Tab Content */}
        <Box className={styles.contentSection}>
          <Paper elevation={0} sx={{ mt: 2, p: 3, borderRadius: 2 }}>
            {loading && (
              <LoadingState
                variant="linear"
                message="Refreshing data..."
                size="small"
                sx={{ mb: 2 }}
              />
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <ActiveComponent
              application={application}
              environments={environments}
              variables={variables}
              manifests={manifests}
              revisions={revisions}
              selectedEnvironment={selectedEnvironment}
              onEnvironmentChange={selectEnvironment}
              onRefresh={refreshAll}
            />
          </Paper>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default ApplicationDetailsPage;
