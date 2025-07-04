import {
  Alert,
  Box,
  Button,
  Chip,
  Grid, IconButton,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
   Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Foo: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{
      display: 'flex',
      height: '100%',
    }}>
      <Box
        component="nav"
        aria-label="settings navigation"
        sx={{
          height: '100%',
          width: 220,
          backgroundColor: theme.palette.dark['main'],
          color: theme.palette.text.primary,
          p: 2,
          top: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h4" sx={{ minHeight: 32, py: 1 }}>
          Organization
        </Typography>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemText sx={{ minHeight: 32, py: 1 }}>Users</ListItemText>
          <ListItemText sx={{ minHeight: 32, py: 1 }}>Variables</ListItemText>
        </ListItem>
      </Box>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h2" gutterBottom>
          Variables
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          You can add as many variables as needed. Admiral will use these variables for all operations across all
          applications.
        </Typography>

        <TableContainer
          sx={{
            display: 'inline-block',
            borderRadius: 1,
            overflow: 'hidden',
            mt: 2,
          }}
        >
          <Table sx={{
            // tableLayout: 'fixed'
          }}>
            {/* Table Header */}
            <TableHead>
              <TableRow>
                <TableCell sx={{
                  fontWeight: 'bold',
                  // width: '45%',
                }}>Key</TableCell>
                <TableCell        sx={{
                  fontWeight: 'bold',
                  // width: '45%',
                }}>Value</TableCell>
                <TableCell             sx={{
                  fontWeight: 'bold',
                  // width: '10%',
                  textAlign: 'center',
                }}
                >Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={3}>There are no variables added.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Button
          variant="contained"
          startIcon={<span>+</span>}
          // onClick={handleAddVariable}
          sx={{ mt: 2 }}
        >
          Add variable
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;
