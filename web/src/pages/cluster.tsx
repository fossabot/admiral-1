import {
  Box,
  Button,
  Link as MuiLink,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Breadcrumbs,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import InfoIcon from '@mui/icons-material/Info';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { Cluster } from '@/types/cluster';
import { services } from '@/services';

const ClusterPage: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await services.cluster.list();
        console.log(response);
        setClusters(response.items || []);
        setLoading(false);

      } catch (error: unknown) {
        console.log(error);
        setError(true); // <-- handle error
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  if (isLoading) {
    return (
      <>
        {/* <Header /> */}
        <Stack direction="row" justifyContent="center" alignItems="center" sx={{ height: '100vh' }}>
          <CircularProgress />
        </Stack>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* <Header /> */}
        <p>Failed to load clusters. Please try again later.</p>
      </>
    );
  }

  return (
    <>
      <Stack spacing={2} sx={{ p: 3 }}>
        {/* Main Page Title */}
        <Typography variant="h4" component="h1">
          Clusters
        </Typography>

        {/* Subheading */}
        <Typography variant="body1">Set up a secure connection between Admiral and your infrastructure.</Typography>

        {/* "Your Tunnels" Section Header */}
        <Box>
          <Typography variant="h5" component="h2">
            Your clusters{' '}
            <Typography variant="body2" component="span">
              (Showing 1 - 1)
            </Typography>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage the configurations of your existing clusters.
          </Typography>
        </Box>

        {/* Action buttons / Search */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ width: '100%' }}>
          <Button variant="contained">+ Create a tunnel</Button>
          <TextField variant="outlined" size="small" placeholder="Search by cluster name" sx={{ width: 250 }} />
        </Stack>

        {/* Divider to separate actions from table */}
        <Divider />

        {/* Tunnels Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cluster name</TableCell>
                <TableCell>Cluster ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uptime</TableCell>
                <TableCell align="right">Options</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {clusters.map((cluster) => (
                <TableRow key={cluster.id}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <InfoIcon color="info" />
                      <MuiLink href="#" underline="hover">
                        {cluster.name}
                      </MuiLink>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <MuiLink href="#" underline="hover">
                      {cluster.id}
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px',
                        bgcolor: 'success.lighter',
                        color: 'success.main',
                      }}
                    >
                      STATUS
                    </Box>
                  </TableCell>
                  <TableCell>UPTIME</TableCell>
                  <TableCell align="right">
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="body2">1 - 1 | Items per page: 10</Typography>
          <Typography variant="body2">1 of 1 page</Typography>
        </Box>
      </Stack>
    </>
  );
};

export default ClusterPage;
