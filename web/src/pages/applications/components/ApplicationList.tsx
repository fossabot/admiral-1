import React, { useRef } from 'react';
import {
  Card,
  CardContent,
  Stack,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import { EmptyState, LoadingState } from '@/components';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CloneIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

import { useInfiniteScroll } from '../hooks/use-infinite-scroll';
import type { Application } from '@/types/application';

type ApplicationListProps = {
  apps: Application[];
  nextCursor: string | null;
  loading: boolean;
  fetchPage: (cursor: string | null, filter?: string) => Promise<void>;
};

const ApplicationCard: React.FC<{
  app: Application;
}> = ({ app }) => {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
        {/* Avatar */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: `hsl(${app.name.charCodeAt(0) * 7}, 50%, 50%)`,
          }}
        >
          {app.name.charAt(0).toUpperCase()}
        </Avatar>

        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            component={Link}
            to={`/applications/${app.id}`}
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {app.name}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {app.description || 'No description available'}
          </Typography>
        </Box>

        {/* Actions */}
        <IconButton size="small" onClick={handleMenuClick}>
          <MoreIcon />
        </IconButton>
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 160 } }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><CloneIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Clone" />
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </Card>
  );
};

const ApplicationList: React.FC<ApplicationListProps> = ({
  apps,
  nextCursor,
  loading,
  fetchPage,
}) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScroll({ loadMoreRef, nextCursor, loading, fetchPage });

  if (apps.length === 0 && !loading) {
    return (
      <EmptyState
        title="No applications found"
        description="Try adjusting your search criteria or create a new application."
      />
    );
  }

  return (
    <Stack spacing={0}>
      {apps.map((app) => (
        <ApplicationCard key={app.id} app={app} />
      ))}

      <Box ref={loadMoreRef} sx={{ height: 1 }} />
      {loading && (
        <LoadingState message="Loading more applications..." size="small" />
      )}
    </Stack>
  );
};

export default ApplicationList;
