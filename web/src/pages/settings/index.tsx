import React from 'react';
import { Paper, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import UsersPage from './components/UsersPage';
import VariablesPage from './components/VariablesPage';

import styles from './styles.module.scss';

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Paper className={styles.paper}>
      <Box className={styles.container}>
        {currentPath.includes('/settings/users') && <UsersPage />}
        {currentPath.includes('/settings/variables') && <VariablesPage />}
      </Box>
    </Paper>
  );
};


export default SettingsPage;
