import React from 'react';
import { Box } from '@mui/material';

import ApplicationSearch from './components/ApplicationSearch';
import ApplicationList from './components/ApplicationList';
import ApplicationDialog from './components/ApplicationDialog';
import { useApplicationData } from './hooks/use-application-data';
import { useApplicationCreate } from './hooks/use-application-create';
import { PageContainer, PageHeader, LoadingState, EmptyState } from '@/components';

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
    return <LoadingState message="Loading applications..." />;
  }

  if (error) {
    return (
      <PageContainer maxWidth="lg" variant="simple">
        <EmptyState
          title="Failed to load applications"
          description="Something went wrong while loading your applications. Please try again."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" variant="simple">
      <PageHeader
        title="Applications"
        description="Manage and deploy your applications across environments"
      />

      <ApplicationSearch
        search={search}
        setSearch={setSearch}
        handleSearch={handleSearch}
        loading={loading}
        openDialog={openDialog}
      />

      <Box>
        <ApplicationList
          apps={apps}
          nextCursor={nextCursor}
          loading={loading}
          fetchPage={fetchPage}
        />
      </Box>

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
    </PageContainer>
  );
};

export default ApplicationsPage;
