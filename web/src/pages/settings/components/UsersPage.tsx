import React from 'react';
import {
  Typography,
  Box,
  Paper,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Table,
} from '@mui/material';

const UsersPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Users
      </Typography>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                <Typography fontWeight="bold">Key</Typography>
              </TableCell>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                <Typography fontWeight="bold">Value</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow></TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsersPage;
