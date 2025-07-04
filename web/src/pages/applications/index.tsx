import React from 'react';
import { Paper, Box, CircularProgress, Alert } from '@mui/material';

import ApplicationSearch from './components/ApplicationSearch';
import ApplicationList from './components/ApplicationList';
import ApplicationDialog from './components/ApplicationDialog';
import { useApplicationData } from './hooks/use-application-data';
import { useApplicationCreate } from './hooks/use-application-create';

import styles from './styles.module.scss';

// Ensure TypeScript recognizes JSX elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    }
  }
}

const ApplicationsPage: React.FC = () => {
  const { apps, loading, error, search, setSearch, handleSearch, nextCursor, fetchPage, isInitialized } =
    useApplicationData();
  const {
    dialogOpen,
    openDialog,
    closeDialog,
    createError,
    newName,
    setNewName,
    newDesc,
    setNewDesc,
    creating,
    handleCreate,
  } = useApplicationCreate();

  if (!isInitialized) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Failed to load applications.</Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Box>
        <ApplicationSearch
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
          loading={loading}
          openDialog={openDialog}
        />
        <ApplicationList apps={apps} nextCursor={nextCursor} loading={loading} fetchPage={fetchPage} />
        <ApplicationDialog
          open={dialogOpen}
          onClose={closeDialog}
          createError={createError}
          newName={newName}
          setNewName={setNewName}
          newDesc={newDesc}
          setNewDesc={setNewDesc}
          creating={creating}
          handleCreate={handleCreate}
        />
      </Box>
    </Paper>
  );
};

export default ApplicationsPage;
