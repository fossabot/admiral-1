import { JSX } from 'react';
import { Box, BoxProps } from '@mui/material';
import { useSelector } from 'react-redux';

import { RootState } from '@/store';
import { menu } from '@/store/slices/menu.ts';
import { Logo } from '@/components/Logo';

const SidebarHeader = (): JSX.Element => {
  const { drawerOpen } = useSelector((state: RootState) => menu(state));

  const boxProps: BoxProps = {
    sx: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2,
      minHeight: 64,
    },
  };

  return (
    <Box {...boxProps}>
      <Logo width={drawerOpen ? 90 : 25} height={25} />
    </Box>
  );
};

export default SidebarHeader;
