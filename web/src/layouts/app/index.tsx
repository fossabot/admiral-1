import { JSX } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Sidebar from '@/layouts/app/Sidebar';
import Header from '@/layouts/app/Header';

const AppLayout = (): JSX.Element => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <Sidebar />
      <Box
        component="main"
        role="main"
        aria-label="Main content"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <Header />
        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
