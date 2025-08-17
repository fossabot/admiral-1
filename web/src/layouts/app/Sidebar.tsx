import { JSX, memo } from 'react';
import { Box, styled, Theme } from '@mui/material';
import MuiDrawer, { DrawerProps } from '@mui/material/Drawer';
import { CSSObject } from '@mui/system';
import { useSelector } from 'react-redux';

import { RootState } from '@/store';
import { menu } from '@/store/slices/menu';
import SidebarHeader from '@/layouts/app/SidebarHeader';
import SidebarFooter from '@/layouts/app/SidebarFooter';
import MenuList from '@/layouts/app/MenuList';

const drawerWidth = 220;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
});

const paletteModeMixin = (theme: Theme): CSSObject => ({
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  borderRight: `1px solid ${theme.palette.divider}`,
});

interface CustomDrawerProps extends DrawerProps {
  open: boolean;
}

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})<CustomDrawerProps>(({ theme, open }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  zIndex: 0,
  ...paletteModeMixin(theme),
  ...(open
    ? {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': {
          ...openedMixin(theme),
        },
      }
    : {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': {
          ...closedMixin(theme),
        },
      }),
}));

const Sidebar = (): JSX.Element => {
  const { drawerOpen } = useSelector((state: RootState) => menu(state));

  return (
    <Drawer
      component="nav"
      variant="permanent"
      anchor="left"
      open={drawerOpen}
      aria-label="Main navigation"
      aria-expanded={drawerOpen}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          minWidth: 0,
          flex: '1 1 0%',
          overflow: 'hidden',
        }}
      >
        <SidebarHeader />
        <Box
          sx={{
            flex: '1 1 0%',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
          }}
        >
          <MenuList />
        </Box>
      </Box>
      <SidebarFooter />
    </Drawer>
  );
};

export default memo(Sidebar);
