import React from 'react';
import { useLocation } from 'react-router-dom';

import { PageContainer } from '@/components';
import UsersPage from './components/UsersPage';
import VariablesPage from './components/VariablesPage';

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <PageContainer maxWidth="lg" variant="simple">
      {currentPath.includes('/settings/users') && <UsersPage />}
      {currentPath.includes('/settings/variables') && <VariablesPage />}
    </PageContainer>
  );
};

export default SettingsPage;
