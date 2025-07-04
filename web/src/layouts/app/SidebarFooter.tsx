import { JSX, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SxProps,
  Tooltip as MuiTooltip,
  ButtonBase,
  Typography,
} from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { openDrawer, menu } from '@/store/slices/menu';
import { RootState } from '@/store';
import { MenuState } from '@/types/menu';

const SidebarFooter = (): JSX.Element => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { drawerOpen } = useSelector((state: RootState) => menu(state) as MenuState);
  const isDrawerOpen = typeof drawerOpen === 'boolean' ? drawerOpen : false;

  const handleClick = useCallback((): void => {
    dispatch(openDrawer(!drawerOpen));
  }, [drawerOpen, dispatch]);

  const listItemButtonSx: SxProps<Theme> = {
    borderRadius: '8px',
    height: 46,
    alignItems: 'center',
    justifyContent: drawerOpen ? 'initial' : 'center',
    ...(drawerOpen
      ? {}
      : {
          '&:hover': {
            background: 'transparent',
          },
          '&.Mui-selected': {
            background: 'transparent',
            '&:hover': {
              background: 'transparent',
            },
          },
        }),
  };

  const listItemIconSx: SxProps<Theme> = {
    borderRadius: '8px',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    ...(drawerOpen
      ? {
          mr: 1,
          '&:hover': {
            backgroundColor: 'transparent',
          },
          '&.Mui-selected': {
            '&:hover': {
              backgroundColor: 'transparent',
            },
            backgroundColor: 'transparent',
          },
        }
      : {
          width: 46,
          height: 46,
          mr: 'auto',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main + 25 : theme.palette.secondary.light,
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.secondary.light,
            '&:hover': {
              backgroundColor: theme.palette.secondary.light,
            },
          },
        }),
  };

  const Button = (
    <ListItemButton
      component="div"
      role="button"
      disableRipple={!drawerOpen}
      sx={listItemButtonSx}
      aria-expanded={drawerOpen ? 'true' : 'false'}
      aria-label={drawerOpen ? 'Collapse drawer' : 'Expand drawer'}
      onClick={handleClick}
    >
      <ButtonBase aria-label="theme-icon" sx={{ borderRadius: '8px' }} disableRipple={isDrawerOpen}>
        <ListItemIcon sx={listItemIconSx}>{drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}</ListItemIcon>
      </ButtonBase>

      {isDrawerOpen && (
        <ListItemText
          primary={
            drawerOpen ? (
              <Typography variant={'h5'} color="inherit">
                Collapse
              </Typography>
            ) : (
              <Typography variant={'h5'} color="inherit">
                Expand
              </Typography>
            )
          }
        />
      )}
    </ListItemButton>
  );

  return (
    <List>
      <ListItem disablePadding sx={{ display: 'block', pt: '12px' }}>
        {drawerOpen ? (
          Button
        ) : (
          <MuiTooltip title="Expand" placement="right" enterDelay={500} aria-label="Expand drawer tooltip" arrow>
            {Button}
          </MuiTooltip>
        )}
      </ListItem>
    </List>
  );
};

export default memo(SidebarFooter);
