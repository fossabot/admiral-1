import React, { useEffect, useState } from 'react';
import {
  Button,
} from '@mui/material';
import { PageContainer, PageHeader, LoadingState, EmptyState } from '@/components';

import CreateClusterDialog from '@/pages/clusters/components/CreateClusterDialog.tsx';
import ClusterList from '@/pages/clusters/components/ClusterList.tsx';
import EditClusterDialog from '@/pages/clusters/components/EditClusterDialog.tsx';
import ResetTokenDialog from '@/pages/clusters/components/ResetTokenDialog.tsx';
import DeleteClusterDialog from '@/pages/clusters/components/DeleteClusterDialog.tsx';
import { useClusterData } from '@/pages/clusters/hooks/use-cluster-data.ts';
import type { Cluster } from '@/types/cluster';

const ClusterPage: React.FC = () => {
  const { clusters, fetchAllClusters, loading, error, isInitialized } = useClusterData();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetTokenDialogOpen, setResetTokenDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  useEffect(() => {
    fetchAllClusters();
  }, [fetchAllClusters]);

  const handleCreateCluster = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateSuccess = () => {
    fetchAllClusters();
  };

  const handleEdit = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      setSelectedCluster(cluster);
      setEditDialogOpen(true);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCluster(null);
  };

  const handleEditSuccess = () => {
    fetchAllClusters();
  };

  const handleResetToken = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      setSelectedCluster(cluster);
      setResetTokenDialogOpen(true);
    }
  };

  const handleCloseResetTokenDialog = () => {
    setResetTokenDialogOpen(false);
    setSelectedCluster(null);
  };

  const handleDelete = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      setSelectedCluster(cluster);
      setDeleteDialogOpen(true);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedCluster(null);
  };

  const handleDeleteSuccess = () => {
    fetchAllClusters();
  };

  if (!isInitialized || loading) {
    return <LoadingState message="Loading clusters..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load clusters"
        description="Something went wrong while loading your clusters. Please try again."
      />
    );
  }

  return (
    <PageContainer maxWidth="lg" variant="simple">
      <PageHeader
        title="Clusters"
        description="Set up a secure connection between Admiral and your Kubernetes clusters."
        actions={
          <Button variant="contained" startIcon={<span>+</span>} onClick={handleCreateCluster}>
            Create Cluster
          </Button>
        }
      />

      <ClusterList
        clusters={clusters}
        onEdit={handleEdit}
        onResetToken={handleResetToken}
        onDelete={handleDelete}
      />

      <CreateClusterDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <EditClusterDialog
        open={editDialogOpen}
        cluster={selectedCluster}
        onClose={handleCloseEditDialog}
        onSuccess={handleEditSuccess}
      />

      <ResetTokenDialog
        open={resetTokenDialogOpen}
        cluster={selectedCluster}
        onClose={handleCloseResetTokenDialog}
      />

      <DeleteClusterDialog
        open={deleteDialogOpen}
        cluster={selectedCluster}
        onClose={handleCloseDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />
    </PageContainer>
  );
};

export default ClusterPage;
