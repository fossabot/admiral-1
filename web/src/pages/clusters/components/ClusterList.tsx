import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { StatusChip, DataTable } from '@/components';
import type { Column } from '@/components';

import type { Cluster } from '@/types/cluster';

interface ClusterListProps {
  clusters: Cluster[];
  onEdit: (clusterId: string) => void;
  onResetToken: (clusterId: string) => void;
  onDelete: (clusterId: string) => void;
}

const ClusterList: React.FC<ClusterListProps> = ({
  clusters,
  onEdit,
  onResetToken,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, clusterId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedClusterId(clusterId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClusterId(null);
  };

  const handleEdit = () => {
    if (selectedClusterId) {
      onEdit(selectedClusterId);
    }
    handleMenuClose();
  };

  const handleResetToken = () => {
    if (selectedClusterId) {
      onResetToken(selectedClusterId);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedClusterId) {
      onDelete(selectedClusterId);
    }
    handleMenuClose();
  };

  const sortedClusters = [...clusters].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  const columns: Column<Cluster>[] = [
    {
      id: 'name',
      label: 'Name',
      format: (value) => <Typography>{String(value)}</Typography>,
    },
    {
      id: 'id',
      label: 'Id',
      format: (value) => <Typography>{String(value)}</Typography>,
    },
    {
      id: 'status',
      label: 'Status',
      format: () => <StatusChip status="healthy" label="Active" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      format: (_, cluster) => (
        <IconButton size="small" onClick={(event) => handleMenuOpen(event, cluster.id)}>
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={sortedClusters}
        keyField="id"
        emptyState={{
          title: 'No clusters found',
          description: 'Add a cluster to get started.',
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              overflowX: 'hidden',
            },
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          Edit
        </MenuItem>
        <MenuItem onClick={handleResetToken} sx={{ color: '#1976d2' }}>
          Reset Token
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: '#d32f2f' }}>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default ClusterList;
